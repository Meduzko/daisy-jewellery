#!/usr/bin/env node
// Phase 1 of the image move to Cloudflare R2: download every product image, byte for byte,
// to data/product-images/ and write manifest.json + report.json there.
//
//   npm run images:download                       # DB + DNTrade ring pieces (variant images)
//   npm run images:download -- --no-api           # DB only (product_images)
//   npm run images:download -- --concurrency=4 --retries=5 --env=production
//
// Sources: product_images (what the site shows: gallery in sort_order, first = main) for every
// product regardless of status; ring pieces from the DNTrade API (website_synch = 0), linked to
// products through product_variants.legacy_id — their images are not in the DB. The API is also
// cross-checked against product_images: card images missing from the DB are reported, not fetched.
// Read-only: nothing in the DB or at the source is changed.
//
// Each distinct URL is downloaded once, to <product id>_<code>/ of the first product that uses it;
// other products point to the same file (shared_with / duplicate_of). Files are written to a .part
// file and renamed, so a file at its final path is always complete; a rerun re-hashes it and skips it.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const knexFactory = require('knex');

const ROOT = path.resolve(__dirname, '..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  })
);
const ENV = args.env || 'development';
const CONCURRENCY = Number(args.concurrency) || 6;
const RETRIES = Number(args.retries) || 4;
const OUT = path.join(ROOT, 'data', 'product-images');
const MANIFEST = path.join(OUT, 'manifest.json');
const knexConfig = require(path.join(ROOT, 'knexfile.js'))[ENV]; // loads .env.local

const clean = (v) => (v == null ? null : String(v).trim() || null);
const safe = (s) => String(s).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/, '').slice(0, 120) || '_';
function originalName(url) {
  const base = new URL(url).pathname.split('/').pop() || 'image';
  try {
    return decodeURIComponent(base);
  } catch {
    return base;
  }
}

// Magic bytes → type. Anything else (HTML error page, empty body, JSON) is rejected.
function detectType(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  if (buf.toString('latin1', 0, 4) === 'GIF8') return 'gif';
  if (buf.toString('latin1', 4, 8) === 'ftyp') {
    const brand = buf.toString('latin1', 8, 12);
    return /^avi[fs]$/.test(brand) ? 'avif' : /^(heic|heix|mif1|msf1)$/.test(brand) ? 'heic' : null;
  }
  if (buf[0] === 0x42 && buf[1] === 0x4d) return 'bmp';
  return null;
}
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- sources
async function collect(db) {
  const products = await db('products as p')
    .join('categories as c', 'c.id', 'p.category_id')
    .select('p.id', 'p.legacy_id', 'p.legacy_code', 'p.article', 'p.status', 'c.code as category')
    .orderBy('p.id');
  const images = await db('product_images').whereNotNull('url').select('id', 'product_id', 'url', 'sort_order').orderBy(['product_id', 'sort_order', 'id']);

  const byProduct = new Map(products.map((p) => [p.id, p]));
  const refs = []; // one per (product, url, role)
  for (const img of images) {
    const list = refs.filter((r) => r.product_id === img.product_id && r.role === 'gallery');
    if (list.some((r) => r.url === clean(img.url))) continue; // same URL twice on one card
    refs.push({ product_id: img.product_id, role: 'gallery', url: clean(img.url), order: list.length, db_image_id: img.id });
  }

  const api = { used: false, card_images_not_in_db: [], pieces: 0, pieces_unlinked: 0, pieces_without_image: 0 };
  if (!args['no-api']) {
    const { readFromApi } = require(path.join(ROOT, 'db/import/import-dntrade-api.js'));
    const items = await readFromApi();
    api.used = true;
    const productByCode = new Map(products.map((p) => [String(p.legacy_code), p]));
    const dbUrls = new Set(refs.map((r) => r.url));
    const variants = await db('product_variants').whereNotNull('legacy_id').select('product_id', 'legacy_id', 'legacy_code');
    const variantByGuid = new Map(variants.map((v) => [v.legacy_id, v]));

    const pieceRefs = new Map(); // product_id|url → ref
    for (const p of items) {
      const urls = [...new Set([clean(p.image_path), ...(p.images || []).map(clean)].filter(Boolean))];
      if (Number(p.website_synch) === 1) {
        for (const url of urls) {
          if (!dbUrls.has(url)) api.card_images_not_in_db.push({ code: clean(p.code), product_id: productByCode.get(String(p.code))?.id ?? null, url });
        }
        continue;
      }
      api.pieces += 1;
      if (!urls.length) { api.pieces_without_image += 1; continue; }
      const variant = variantByGuid.get(clean(p.product_id));
      if (!variant) { api.pieces_unlinked += 1; continue; }
      urls.forEach((url) => {
        const key = `${variant.product_id}|${url}`;
        if (!pieceRefs.has(key)) {
          pieceRefs.set(key, { product_id: variant.product_id, role: 'variant', url, order: null, variant_codes: [] });
        }
        pieceRefs.get(key).variant_codes.push(clean(p.code));
      });
    }
    // variant images the card gallery already has are the same file — don't list them twice
    for (const ref of pieceRefs.values()) {
      if (!refs.some((r) => r.product_id === ref.product_id && r.url === ref.url)) refs.push(ref);
    }
  }
  return { products, byProduct, refs, api };
}

// ---------------------------------------------------------------- download
async function download(url) {
  let last;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt) await sleep(500 * 2 ** (attempt - 1));
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (res.status === 404 || res.status === 410) return { status: 'missing', http_status: res.status };
      if (!res.ok) {
        last = `HTTP ${res.status}`;
        if (res.status !== 429 && res.status < 500) break;
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const type = detectType(buf);
      if (!type) {
        last = `not an image (${res.headers.get('content-type') || 'no content-type'}, ${buf.length} bytes)`;
        continue; // a CDN hiccup can serve an HTML page; retry
      }
      const len = Number(res.headers.get('content-length'));
      if (len && len !== buf.length && !res.headers.get('content-encoding')) {
        last = `truncated (${buf.length}/${len} bytes)`;
        continue;
      }
      return { status: 'downloaded', buf, type, content_type: res.headers.get('content-type') };
    } catch (e) {
      last = e.name === 'TimeoutError' ? 'timeout' : e.message;
    }
  }
  return { status: 'failed', error: last };
}

async function pool(items, n, fn) {
  let i = 0;
  let done = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      await fn(items[i++]);
      if (++done % 50 === 0 || done === items.length) process.stdout.write(`  ${done}/${items.length}\n`);
    }
  }));
}

// ---------------------------------------------------------------- main
async function main() {
  const db = knexFactory(knexConfig);
  let data;
  try {
    data = await collect(db);
  } finally {
    await db.destroy();
  }
  const { products, byProduct, refs, api } = data;

  const previous = new Map();
  try {
    for (const f of JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).files || []) previous.set(f.url, f);
  } catch {
    // first run
  }

  // one file per distinct URL, placed under the first product (lowest id; gallery before variant)
  const files = new Map();
  const used = new Set();
  for (const ref of [...refs].sort((a, b) => a.product_id - b.product_id || (a.role === 'variant') - (b.role === 'variant') || (a.order ?? 0) - (b.order ?? 0))) {
    if (files.has(ref.url)) continue;
    const p = byProduct.get(ref.product_id);
    const dir = `${p.id}_${safe(p.legacy_code || p.legacy_id || 'no-code')}`;
    const name = safe(originalName(ref.url));
    const prefix = ref.role === 'gallery' ? `${String(ref.order).padStart(2, '0')}_` : 'variants/';
    let rel = `${dir}/${prefix}${name}`;
    // stable across runs: reuse the previous path; otherwise suffix on collision
    if (previous.get(ref.url)?.local_path) rel = previous.get(ref.url).local_path;
    for (let k = 2; used.has(rel.toLowerCase()); k++) rel = `${dir}/${prefix}${k}_${name}`;
    used.add(rel.toLowerCase());
    files.set(ref.url, { url: ref.url, original_filename: originalName(ref.url), local_path: rel });
  }

  console.log(`${products.length} products, ${refs.length} image references, ${files.size} distinct URLs`);
  fs.mkdirSync(OUT, { recursive: true });

  await pool([...files.values()], CONCURRENCY, async (file) => {
    const abs = path.join(OUT, file.local_path);
    if (fs.existsSync(abs)) {
      const buf = fs.readFileSync(abs);
      const type = detectType(buf);
      const prev = previous.get(file.url);
      if (type && (!prev?.sha256 || prev.sha256 === sha256(buf))) {
        Object.assign(file, { status: 'verified', file_type: type, size: buf.length, sha256: sha256(buf), content_type: prev?.content_type ?? null });
        return;
      }
    }
    const r = await download(file.url);
    if (r.status !== 'downloaded') {
      Object.assign(file, { status: r.status, http_status: r.http_status ?? null, error: r.error ?? null });
      return;
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(`${abs}.part`, r.buf);
    fs.renameSync(`${abs}.part`, abs);
    Object.assign(file, { status: 'downloaded', file_type: r.type, content_type: r.content_type, size: r.buf.length, sha256: sha256(r.buf) });
  });

  // ------------------------------------------------------------ manifest
  const usersByUrl = new Map();
  for (const ref of refs) {
    if (!usersByUrl.has(ref.url)) usersByUrl.set(ref.url, new Set());
    usersByUrl.get(ref.url).add(ref.product_id);
  }
  const byHash = new Map();
  for (const f of files.values()) {
    if (!f.sha256) continue;
    if (!byHash.has(f.sha256)) byHash.set(f.sha256, []);
    byHash.get(f.sha256).push(f.url);
  }

  const entries = refs.map((ref) => {
    const p = byProduct.get(ref.product_id);
    const f = files.get(ref.url);
    const owner = Number(f.local_path.split('_')[0]);
    return {
      product_id: p.id,
      product_code: p.legacy_code,
      article: p.article,
      dntrade_guid: p.legacy_id,
      category: p.category,
      product_status: p.status,
      role: ref.role,
      order: ref.order,
      is_primary: ref.role === 'gallery' && ref.order === 0,
      variant_codes: ref.variant_codes,
      db_image_id: ref.db_image_id,
      url: ref.url,
      original_filename: f.original_filename,
      local_path: f.local_path,
      file_type: f.file_type ?? null,
      size: f.size ?? null,
      sha256: f.sha256 ?? null,
      status: f.status,
      error: f.error ?? null,
      shared_with: [...usersByUrl.get(ref.url)].filter((id) => id !== p.id),
      duplicate_of: owner !== p.id ? f.local_path : null, // file lives under another product
    };
  });

  const ok = (s) => s === 'downloaded' || s === 'verified';
  const fileList = [...files.values()];
  const withImages = new Set(refs.filter((r) => r.role === 'gallery').map((r) => r.product_id));
  const okGallery = new Set(entries.filter((e) => e.role === 'gallery' && ok(e.status)).map((e) => e.product_id));
  const report = {
    generated_at: new Date().toISOString(),
    database_env: ENV,
    products: {
      total: products.length,
      with_gallery_images: withImages.size,
      without_any_image: products.filter((p) => !withImages.has(p.id)).map((p) => ({ id: p.id, code: p.legacy_code, status: p.status })),
      with_no_downloaded_gallery_image: products.filter((p) => withImages.has(p.id) && !okGallery.has(p.id)).map((p) => ({ id: p.id, code: p.legacy_code })),
    },
    images: {
      references: refs.length,
      gallery_references: refs.filter((r) => r.role === 'gallery').length,
      variant_references: refs.filter((r) => r.role === 'variant').length,
      distinct_urls: files.size,
      downloaded_now: fileList.filter((f) => f.status === 'downloaded').length,
      already_verified: fileList.filter((f) => f.status === 'verified').length,
      failed: fileList.filter((f) => f.status === 'failed').map((f) => ({ url: f.url, error: f.error })),
      missing_at_source: fileList.filter((f) => f.status === 'missing').map((f) => ({ url: f.url, http_status: f.http_status, products: [...usersByUrl.get(f.url)] })),
      total_bytes: fileList.reduce((s, f) => s + (f.size || 0), 0),
      by_type: fileList.reduce((m, f) => (f.file_type ? { ...m, [f.file_type]: (m[f.file_type] || 0) + 1 } : m), {}),
    },
    duplicates: {
      urls_shared_by_products: [...usersByUrl].filter(([, s]) => s.size > 1).map(([url, s]) => ({ url, products: [...s] })),
      identical_content_different_urls: [...byHash.values()].filter((urls) => urls.length > 1),
    },
    dntrade_api: api,
  };

  fs.writeFileSync(MANIFEST, JSON.stringify({ generated_at: report.generated_at, files: fileList, images: entries }, null, 2));
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

  const im = report.images;
  console.log(`
Products:          ${report.products.total} (with gallery images: ${report.products.with_gallery_images}, without: ${report.products.without_any_image.length})
Image references:  ${im.references} (gallery ${im.gallery_references}, variant ${im.variant_references})
Distinct files:    ${im.distinct_urls} — downloaded ${im.downloaded_now}, already verified ${im.already_verified}, failed ${im.failed.length}, missing at source ${im.missing_at_source.length}
Size:              ${(im.total_bytes / 1048576).toFixed(1)} MB ${JSON.stringify(im.by_type)}
Duplicates:        ${report.duplicates.urls_shared_by_products.length} URLs shared by several products, ${report.duplicates.identical_content_different_urls.length} groups of identical files under different URLs
DNTrade API:       ${api.used ? `${api.pieces} ring pieces (${api.pieces_unlinked} not linked to a variant, ${api.pieces_without_image} without image); ${api.card_images_not_in_db.length} card images not in the DB` : 'skipped (--no-api)'}
Manifest:          ${path.relative(ROOT, MANIFEST)}, report: ${path.relative(ROOT, path.join(OUT, 'report.json'))}`);
  if (im.failed.length || im.missing_at_source.length) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { detectType };
