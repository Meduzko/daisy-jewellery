#!/usr/bin/env node
// Map product_images rows to the images already uploaded to Cloudflare R2 (product_images.r2_key).
//
//   npm run images:r2                                   # dry run: list R2, plan, write the report
//   npm run images:r2 -- --inventory=<file.json>        # reuse a saved R2 listing (no R2 credentials)
//   npm run images:r2 -- --validate                     # exit 1 if stored r2_key values are stale or missing in R2
//   npm run images:r2 -- --apply                        # write the planned r2_key values (one transaction)
//   options: --env=production  --manifest=<path>  --out=<dir>
//
// R2 listing needs R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (server-only), R2_BUCKET
// (default daisy-jewellery-images). Read-only on R2: only ListObjectsV2.
//
// How a row gets a key — nothing is guessed:
//   1. data/product-images/manifest.json (npm run images:download) records which file each DNTrade
//      URL was saved to: files[].url → files[].local_path, e.g. "100_7648/00_1414.10_1.jpg". The upload
//      kept those paths, so local_path is the R2 key.
//   2. The key must exist in the R2 listing (exact key; Unicode NFC/NFD differences are tolerated and
//      the exact R2 spelling is stored).
//   3. The manifest must have recorded this (product, URL) pair, and the folder's product code must
//      belong to a product that still uses this URL in the DB (shared images live under the first
//      product's folder). Anything else is reported as ambiguous and left NULL (DNTrade fallback).
// Order and the main image are not touched: they stay product_images.sort_order.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;
const nfc = (s) => String(s).normalize('NFC');

/** "100_7648/00_x.jpg" → { folder: "100_7648", seq: "100", code: "7648", variant: false } */
function parseKey(key) {
  const m = /^(\d+)_([^/]+)\/(variants\/)?([^/]+)$/.exec(key);
  return m ? { folder: `${m[1]}_${m[2]}`, seq: m[1], code: m[2], variant: Boolean(m[3]), name: m[4] } : null;
}

/**
 * Pure planning step (tested in test/images/r2-mapping.test.mjs).
 * @param {object} input
 * @param {{key:string,size:number}[]} input.objects    R2 listing
 * @param {{files:object[],images:object[]}} input.manifest  download manifest
 * @param {{id:number,legacy_code:string|null,status?:string}[]} input.products
 * @param {{id:number,product_id:number,url:string,sort_order:number,r2_key:string|null}[]} input.rows  product_images
 */
function planMappings({ objects, manifest, products, rows }) {
  const productById = new Map(products.map((p) => [p.id, p]));
  const productsByCode = new Map();
  for (const p of products) {
    const code = p.legacy_code == null ? null : String(p.legacy_code);
    if (!code) continue;
    if (!productsByCode.has(code)) productsByCode.set(code, []);
    productsByCode.get(code).push(p);
  }

  // ---- R2 inventory
  const objectByKey = new Map(); // NFC key → object
  const duplicateObjectKeys = []; // two R2 keys that differ only in Unicode normalization
  const invalidObjects = [];
  let cmsObjects = 0;
  for (const o of objects) {
    if (o.key.startsWith('cms/')) { cmsObjects += 1; continue; } // Directus uploads: linked by product_images.file
    const parsed = parseKey(o.key);
    if (!parsed) { invalidObjects.push({ key: o.key, reason: 'key is not <seq>_<code>/<file>' }); continue; }
    if (!IMAGE_EXT.test(o.key)) { invalidObjects.push({ key: o.key, reason: 'not a supported image extension' }); continue; }
    if (!o.size) { invalidObjects.push({ key: o.key, reason: 'empty object' }); continue; }
    if (objectByKey.has(nfc(o.key))) { duplicateObjectKeys.push([objectByKey.get(nfc(o.key)).key, o.key]); continue; }
    objectByKey.set(nfc(o.key), { ...o, ...parsed });
  }

  // ---- manifest
  const fileByUrl = new Map(manifest.files.map((f) => [f.url, f]));
  const fileByPath = new Map(manifest.files.filter((f) => f.local_path).map((f) => [nfc(f.local_path), f]));
  const pairs = new Set(manifest.images.map((e) => `${e.product_id}|${e.url}`));

  // DB: who uses each URL (by product code), for the folder check
  const codesByUrl = new Map();
  for (const r of rows) {
    const code = productById.get(r.product_id)?.legacy_code;
    if (!codesByUrl.has(r.url)) codesByUrl.set(r.url, new Set());
    if (code != null) codesByUrl.get(r.url).add(String(code));
  }
  // variant (ring piece) images are not in the DB; the manifest is the only record of their owner
  for (const e of manifest.images) {
    if (e.role === 'variant' && e.product_code != null && codesByUrl.has(e.url)) codesByUrl.get(e.url).add(String(e.product_code));
  }

  // ---- rows
  const planned = []; // { id, product_id, sort_order, url, r2_key }
  const unmapped = []; // { id, product_id, url, reason } — stays on DNTrade
  const ambiguous = [];
  const sizeMismatches = [];
  for (const r of rows) {
    const base = { id: r.id, product_id: r.product_id, sort_order: r.sort_order, url: r.url };
    const file = fileByUrl.get(r.url);
    if (!file || !file.local_path) { unmapped.push({ ...base, reason: 'URL not in the download manifest' }); continue; }
    if (file.status !== 'downloaded' && file.status !== 'verified') {
      unmapped.push({ ...base, reason: `not downloaded (${file.status})` });
      continue;
    }
    const obj = objectByKey.get(nfc(file.local_path));
    if (!obj) { unmapped.push({ ...base, reason: `not in R2: ${file.local_path}` }); continue; }
    if (!pairs.has(`${r.product_id}|${r.url}`)) {
      ambiguous.push({ ...base, r2_key: obj.key, reason: 'manifest did not record this URL for this product' });
      continue;
    }
    const sameCode = productsByCode.get(obj.code) || [];
    if (sameCode.length > 1) {
      ambiguous.push({ ...base, r2_key: obj.key, reason: `folder code ${obj.code} matches ${sameCode.length} products` });
      continue;
    }
    if (!codesByUrl.get(r.url)?.has(obj.code)) {
      ambiguous.push({ ...base, r2_key: obj.key, reason: `folder code ${obj.code} no longer uses this URL in the DB` });
      continue;
    }
    if (file.size && obj.size !== file.size) sizeMismatches.push({ key: obj.key, r2_size: obj.size, downloaded_size: file.size });
    planned.push({ ...base, r2_key: obj.key });
  }

  // ---- changes and validation of what is stored now
  const plannedById = new Map(planned.map((p) => [p.id, p]));
  const changes = [];
  const storedProblems = [];
  for (const r of rows) {
    const want = plannedById.get(r.id)?.r2_key ?? null;
    if (r.r2_key && !objectByKey.has(nfc(r.r2_key))) storedProblems.push({ id: r.id, r2_key: r.r2_key, problem: 'not in R2' });
    else if (r.r2_key && r.r2_key !== want) storedProblems.push({ id: r.id, r2_key: r.r2_key, expected: want, problem: 'differs from the manifest mapping' });
    if ((r.r2_key ?? null) !== want) changes.push({ id: r.id, product_id: r.product_id, from: r.r2_key ?? null, to: want });
  }

  // ---- report
  const usedKeys = new Map(); // key → rows using it
  for (const p of planned) {
    if (!usedKeys.has(p.r2_key)) usedKeys.set(p.r2_key, []);
    usedKeys.get(p.r2_key).push(p.id);
  }
  const usedNfc = new Set([...usedKeys.keys()].map(nfc));
  const ambiguousNfc = new Set(ambiguous.map((a) => nfc(a.r2_key)));
  const unmatchedObjects = [];
  const variantObjects = [];
  for (const o of objectByKey.values()) {
    if (usedNfc.has(nfc(o.key))) continue;
    const known = fileByPath.get(nfc(o.key));
    const inManifestAsVariant = known && manifest.images.some((e) => e.role === 'variant' && e.url === known.url);
    if (o.variant || inManifestAsVariant) variantObjects.push(o.key);
    else unmatchedObjects.push({
      key: o.key,
      reason: ambiguousNfc.has(nfc(o.key)) ? 'ambiguous, see ambiguous_rows'
        : !known ? 'not in the download manifest'
        : !(productsByCode.get(o.code) || []).length ? `no product with code ${o.code}` : 'no product_images row uses its URL',
    });
  }
  const rowsByProduct = new Map();
  for (const r of rows) {
    if (!rowsByProduct.has(r.product_id)) rowsByProduct.set(r.product_id, []);
    rowsByProduct.get(r.product_id).push(r);
  }
  const mappedProducts = new Set(planned.map((p) => p.product_id));
  // primary = lowest (sort_order, id), as the storefront query orders them
  const primaryUnmapped = [];
  for (const [pid, list] of rowsByProduct) {
    const primary = [...list].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)[0];
    if (!plannedById.has(primary.id)) primaryUnmapped.push({ product_id: pid, code: productById.get(pid)?.legacy_code ?? null, url: primary.url });
  }

  return {
    summary: {
      r2_objects: objects.length,
      r2_images: objectByKey.size,
      directus_uploads_skipped: cmsObjects,
      products: products.length,
      products_with_db_images: rowsByProduct.size,
      matched_products: mappedProducts.size,
      fully_matched_products: [...rowsByProduct].filter(([, l]) => l.every((r) => plannedById.has(r.id))).length,
      db_image_rows: rows.length,
      matched_rows: planned.length,
      matched_r2_images: usedKeys.size,
      unmatched_r2_images: unmatchedObjects.length,
      variant_r2_images_not_used_by_site: variantObjects.length,
      invalid_r2_objects: invalidObjects.length,
      unmapped_rows: unmapped.length,
      ambiguous_rows: ambiguous.length,
      products_without_images: products.filter((p) => !rowsByProduct.has(p.id)).length,
      products_whose_main_image_stays_on_dntrade: primaryUnmapped.length,
      r2_keys_shared_by_rows: [...usedKeys.values()].filter((ids) => ids.length > 1).length,
      size_mismatches: sizeMismatches.length,
      changes: changes.length,
      stored_problems: storedProblems.length,
    },
    planned,
    changes,
    storedProblems,
    details: {
      unmapped_rows: unmapped,
      ambiguous_rows: ambiguous,
      unmatched_r2_images: unmatchedObjects,
      invalid_r2_objects: invalidObjects,
      duplicate_r2_keys_unicode: duplicateObjectKeys,
      r2_keys_shared_by_rows: [...usedKeys].filter(([, ids]) => ids.length > 1).map(([key, ids]) => ({ key, rows: ids })),
      products_without_images: products.filter((p) => !rowsByProduct.has(p.id)).map((p) => ({ id: p.id, code: p.legacy_code, status: p.status })),
      products_whose_main_image_stays_on_dntrade: primaryUnmapped,
      size_mismatches: sizeMismatches,
      variant_r2_images_not_used_by_site: variantObjects,
    },
  };
}

async function listR2() {
  const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new Error('Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (or pass --inventory=<file.json>)');
  }
  const bucket = process.env.R2_BUCKET || 'daisy-jewellery-images';
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
  const objects = [];
  let ContinuationToken;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken }));
    for (const o of res.Contents || []) objects.push({ key: o.Key, size: o.Size, etag: o.ETag, last_modified: o.LastModified });
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return { bucket, objects };
}

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  }));
  const ENV = args.env || 'development';
  const OUT = path.resolve(ROOT, args.out || 'data/product-images');
  const knexConfig = require(path.join(ROOT, 'knexfile.js'))[ENV]; // loads .env.local
  const manifest = JSON.parse(fs.readFileSync(path.resolve(ROOT, args.manifest || 'data/product-images/manifest.json'), 'utf8'));

  let inventory;
  if (args.inventory) {
    inventory = JSON.parse(fs.readFileSync(path.resolve(args.inventory), 'utf8'));
  } else {
    inventory = { listed_at: new Date().toISOString(), ...(await listR2()) };
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'r2-inventory.json'), JSON.stringify(inventory, null, 2));
  }

  const db = require('knex')(knexConfig);
  try {
    if (!(await db.schema.hasColumn('product_images', 'r2_key'))) throw new Error('Run the migrations first (npm run db:migrate)');
    const products = await db('products').select('id', 'legacy_code', 'status').orderBy('id');
    const rows = await db('product_images').whereNull('file').select('id', 'product_id', 'url', 'sort_order', 'r2_key').orderBy(['product_id', 'sort_order', 'id']);
    const plan = planMappings({ objects: inventory.objects, manifest, products, rows });

    const report = { generated_at: new Date().toISOString(), database_env: ENV, bucket: inventory.bucket, mode: args.apply ? 'apply' : 'dry-run', ...plan };
    fs.mkdirSync(OUT, { recursive: true });
    const reportPath = path.join(OUT, 'r2-mapping-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.table(plan.summary);
    console.log(`Report: ${path.relative(ROOT, reportPath)}`);

    if (args.apply) {
      await db.transaction(async (trx) => {
        for (const c of plan.changes) await trx('product_images').where({ id: c.id }).update({ r2_key: c.to });
      });
      console.log(`Applied ${plan.changes.length} r2_key changes. Purge the cache: POST /api/catalog/revalidate`);
    } else {
      console.log(`Dry run: ${plan.changes.length} r2_key changes planned, nothing written (--apply to write).`);
    }
    if (args.validate && plan.storedProblems.length) {
      console.error(`${plan.storedProblems.length} stored r2_key values are stale or missing in R2 (see storedProblems).`);
      process.exitCode = 1;
    }
  } finally {
    await db.destroy();
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { planMappings, parseKey };
