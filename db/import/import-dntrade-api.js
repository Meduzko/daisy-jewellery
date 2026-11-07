#!/usr/bin/env node
// Complete the PostgreSQL catalog with data the DNTrade CSV export does not contain,
// read from the DNTrade API (or from a saved JSON snapshot of its responses):
//
//   • products.legacy_id (DNTrade GUID — orders are still uploaded to DNTrade by it)
//   • products.price when still empty; «бейдж» знижка/N → sale_price, новинка/популярне → collections
//   • uk short_description / description
//   • additional product images (appended; existing images are kept)
//   • ring pieces (website_synch = 0) → product_variants: size, weight, stock, barcode,
//     legacy ids — this is what the ring size selector reads
//
//   npm run db:import:dntrade                         # live API (API_ROOT_URI, API_KEY, *_CATEGORY_ID)
//   npm run db:import:dntrade -- --file=dump.json     # {"products":[…]} or […] (API product objects)
//   npm run db:import:dntrade -- --dry-run            # roll back at the end
//   npm run db:import:dntrade -- --env=test
//
// Same policy as import-products.js: run it after the CSV import; cards are matched by
// products.legacy_code = DNTrade `code` and never created here; only NULL fields are
// filled, nothing is overwritten or deleted, differing values are reported as conflicts;
// one transaction with a savepoint per record; refuses production; audit_logs entry.
// Purchase prices, suppliers and store ids are NOT imported.

const fs = require('fs');
const path = require('path');
const knexFactory = require('knex');

const ROOT = path.resolve(__dirname, '../..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  })
);
const ENV = args.env || 'development';
const DRY_RUN = Boolean(args['dry-run']);

// knexfile loads .env.local when DATABASE_URL is not set
const knexConfig = require(path.join(ROOT, 'knexfile.js'))[ENV];

// ---------------------------------------------------------------- helpers
const clean = (v) => (v == null ? null : String(v).trim() || null);
const isNum = (v) => typeof v === 'number' || (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v));
const same = (a, b) => (isNum(a) && isNum(b) ? Number(a) === Number(b) : String(a) === String(b));
const normArticle = (s) => String(s ?? '').trim().toLowerCase();

function parsePrice(v) {
  const t = clean(v)?.replace(/[\s ]/g, '').replace(',', '.');
  return t && /^\d+(\.\d{1,2})?$/.test(t) && Number(t) > 0 ? Number(t).toFixed(2) : null;
}
// "17" / "18,5" / "16см" → number; anything else → null (label kept)
function parseSize(label) {
  const m = clean(label)?.match(/^(\d+(?:[.,]\d+)?)\s*(см)?$/i);
  return m ? Number(m[1].replace(',', '.')) : null;
}
// "2069р#Каблучка 925 срібло 2,40г" → 2.4
function parseWeight(title) {
  const matches = [...String(title || '').matchAll(/(\d+(?:[.,]\d+)?)\s*г(?![a-zа-яіїєґ])/gi)];
  if (!matches.length) return null;
  const n = Number(matches[matches.length - 1][1].replace(',', '.'));
  return n > 0 && n < 1000 ? Number(n.toFixed(3)) : null;
}
const tagValues = (product, title) => [
  ...new Set(
    ((product.tags || []).find((t) => t?.title === title)?.items || [])
      .filter((i) => i?.status !== 0)
      .map((i) => clean(i?.title))
      .filter(Boolean)
  ),
];
const nonEmptyHtml = (html) => {
  const s = clean(html);
  if (!s) return null;
  const text = s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return text ? s : null;
};

/** Fill only NULL columns of an existing row; differing values → conflicts. */
async function fillNulls(trx, table, where, values, conflicts) {
  const existing = await trx(table).where(where).first();
  if (!existing) return null;
  const patch = {};
  for (const [k, v] of Object.entries(values)) {
    if (v == null) continue;
    if (existing[k] == null) patch[k] = v;
    else if (!same(existing[k], v)) conflicts.push({ table, where, field: k, db: existing[k], source: v });
  }
  if (!Object.keys(patch).length) return 'unchanged';
  if ('updated_at' in existing) patch.updated_at = trx.fn.now();
  await trx(table).where(where).update(patch);
  return 'updated';
}

// ---------------------------------------------------------------- source
async function fetchPage({ root, apiKey, categoryId, websiteSynch, offset, limit }) {
  const params = new URLSearchParams({
    category_id: categoryId, website_synch: String(websiteSynch), limit: String(limit), offset: String(offset),
  });
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${root}/products/list?${params}`, {
      method: 'POST',
      headers: { ApiKey: apiKey, 'Content-Type': 'application/json' },
    });
    if (res.ok) return (await res.json())?.products || [];
    if (res.status !== 429 && res.status < 500) throw new Error(`DNTrade API responded ${res.status}`);
    await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
  }
  throw new Error('DNTrade API failed after retries');
}

async function readFromApi() {
  const root = process.env.API_ROOT_URI;
  const apiKey = process.env.API_KEY;
  const categories = {
    rings: process.env.RING_CATEGORY_ID,
    earrings: process.env.EARING_CATEGORY_ID,
    necklaces: process.env.NECKLACE_CATEGORY_ID,
    bracelets: process.env.BRACER_CATEGORY_ID,
  };
  if (!root || !apiKey || Object.values(categories).some((v) => !v)) {
    throw new Error('Live mode needs API_ROOT_URI, API_KEY and RING/EARING/NECKLACE/BRACER_CATEGORY_ID (or use --file=…)');
  }
  const limit = 100;
  const out = [];
  const jobs = Object.values(categories).map((categoryId) => ({ categoryId, websiteSynch: 1 }));
  jobs.push({ categoryId: categories.rings, websiteSynch: 0 }); // ring pieces (sizes)
  for (const job of jobs) {
    for (let offset = 0; ; offset += limit) {
      const page = await fetchPage({ root, apiKey, limit, offset, ...job });
      out.push(...page.map((p) => ({ ...p, website_synch: p.website_synch ?? job.websiteSynch })));
      if (page.length < limit) break;
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  return out;
}

function readFromFile(file) {
  const json = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  const list = Array.isArray(json) ? json : json.products;
  if (!Array.isArray(list)) throw new Error('--file must contain an array or {"products": [...]}');
  return list;
}

// ---------------------------------------------------------------- import
async function importCard(trx, p, report) {
  const code = clean(p.code);
  const product = await trx('products').where('legacy_code', code).first();
  if (!product) {
    report.cards.not_in_db.push({ code, title: clean(p.title) });
    return 'skipped';
  }
  const conflicts = [];
  let changed = false;

  if (product.legacy_id && clean(p.product_id) && product.legacy_id !== clean(p.product_id)) {
    conflicts.push({ table: 'products', where: { legacy_code: code }, field: 'legacy_id', db: product.legacy_id, source: p.product_id });
  }
  const productConflicts = [];
  const s1 = await fillNulls(trx, 'products', { id: product.id }, {
    legacy_id: clean(p.product_id),
    price: parsePrice(p.price),
  }, productConflicts);
  conflicts.push(...productConflicts.filter((c) => c.field !== 'legacy_id')); // legacy_id reported above
  changed ||= s1 === 'updated';

  // «бейдж»: знижка/N → sale_price (if empty, computed like the CSV importer);
  // новинка / популярне → collections new / popular (links are only added)
  const badges = tagValues(p, 'бейдж').map((x) => x.toLowerCase());
  const current = await trx('products').where('id', product.id).first('price', 'sale_price');
  for (const badge of badges) {
    const m = badge.match(/^знижка\/(\d{1,2})$/);
    if (m && current.price != null) {
      const sale = (Math.round(Number(current.price) * (100 - Number(m[1]))) / 100).toFixed(2);
      if (Number(sale) < Number(current.price)) {
        const st = await fillNulls(trx, 'products', { id: product.id }, { sale_price: sale }, conflicts);
        changed ||= st === 'updated';
      }
    }
    const collectionCode = { новинка: 'new', популярне: 'popular' }[badge];
    if (collectionCode) {
      const collection = await trx('collections').where('code', collectionCode).first('id');
      if (!collection) continue;
      const inserted = await trx('collection_products')
        .insert({ collection_id: collection.id, product_id: product.id })
        .onConflict(['collection_id', 'product_id']).ignore()
        .returning('product_id');
      if (inserted.length) { changed = true; report.cards.collection_links_added++; }
    }
  }

  const s2 = await fillNulls(trx, 'product_translations', { product_id: product.id, locale: 'uk' }, {
    short_description: nonEmptyHtml(p.short_description),
    description: nonEmptyHtml(p.description),
  }, conflicts);
  changed ||= s2 === 'updated';

  // images: append URLs that are not there yet, in API order
  const urls = [clean(p.image_path), ...(p.images || []).map(clean)].filter(Boolean);
  const existing = await trx('product_images').where('product_id', product.id).orderBy('sort_order');
  const have = new Set(existing.map((i) => i.url));
  let sort = existing.reduce((m, i) => Math.max(m, i.sort_order), -1);
  const toAdd = [...new Set(urls)].filter((u) => /^https?:\/\//.test(u) && !have.has(u));
  if (toAdd.length) {
    await trx('product_images').insert(toAdd.map((url) => ({ product_id: product.id, url, sort_order: ++sort })));
    report.cards.images_added += toAdd.length;
    changed = true;
  }

  report.conflicts.push(...conflicts);
  return changed ? 'updated' : 'unchanged';
}

async function importPiece(trx, p, ringsByArticle, report) {
  const legacyId = clean(p.product_id);
  const candidates = ringsByArticle.get(normArticle(p.sku)) || [];
  if (!candidates.length) {
    report.pieces.orphans.push({ code: clean(p.code), sku: clean(p.sku), title: clean(p.title) });
    return 'skipped';
  }
  if (candidates.length > 1) {
    report.pieces.ambiguous.push({ code: clean(p.code), sku: clean(p.sku), cards: candidates.map((c) => c.legacy_code) });
  }
  const card = candidates[0];
  const balance = Number(p.balance);
  if (Number.isFinite(balance) && balance < 0) report.pieces.negative_balance.push({ code: clean(p.code), balance });
  const shared = {
    weight_g: parseWeight(p.title),
    stock_qty: Number.isFinite(balance) ? Math.max(0, Math.trunc(balance)) : null,
  };

  // A piece normally has one «розмір»; a few list several sizes (one per item).
  // The first size carries the piece's legacy ids; every further size becomes its own
  // variant keyed "<GUID>#<size>" so re-runs stay idempotent.
  const sizeLabels = tagValues(p, 'розмір');
  if (!sizeLabels.length) report.pieces.without_size.push({ code: clean(p.code), sku: clean(p.sku) });
  if (sizeLabels.length > 1) report.pieces.multi_size.push({ code: clean(p.code), sku: clean(p.sku), sizes: sizeLabels });
  const rows = (sizeLabels.length ? sizeLabels : [null]).map((label, i) => ({
    legacy_id: i === 0 ? legacyId : `${legacyId}#${label}`,
    values: {
      ...shared,
      size_label: label,
      size: parseSize(label),
      legacy_code: i === 0 ? clean(p.code) : null,
      barcode: i === 0 ? clean(p.barcode) : null,
    },
  }));

  let status = 'unchanged';
  for (const row of rows) {
    const existing = row.legacy_id ? await trx('product_variants').where('legacy_id', row.legacy_id).first() : null;
    if (existing) {
      const conflicts = [];
      if ((await fillNulls(trx, 'product_variants', { id: existing.id }, row.values, conflicts)) === 'updated' && status === 'unchanged') {
        status = 'updated';
      }
      report.conflicts.push(...conflicts);
    } else {
      await trx('product_variants').insert({ product_id: card.id, legacy_id: row.legacy_id, ...row.values });
      status = 'inserted';
    }
  }
  return status;
}

async function main() {
  if (process.env.NODE_ENV === 'production' || ENV === 'production') {
    throw new Error('Refusing to run against production. This importer is for local/staging databases.');
  }
  const source = args.file ? `file:${path.relative(ROOT, path.resolve(args.file))}` : 'api';
  const products = args.file ? readFromFile(args.file) : await readFromApi();

  const report = {
    started_at: new Date().toISOString(), env: ENV, dry_run: DRY_RUN, source,
    cards: { total: 0, updated: 0, unchanged: 0, skipped: 0, failed: 0, images_added: 0, collection_links_added: 0, not_in_db: [] },
    pieces: { total: 0, inserted: 0, updated: 0, unchanged: 0, skipped: 0, failed: 0,
      orphans: [], ambiguous: [], without_size: [], multi_size: [], negative_balance: [] },
    failed: [], conflicts: [],
  };

  // de-duplicate API pages by product_id (snapshots can contain repeats); first one wins
  const byId = new Map();
  for (const p of products) if (p && p.product_id && !byId.has(p.product_id)) byId.set(p.product_id, p);
  const unique = [...byId.values()];
  const cards = unique.filter((p) => Number(p.website_synch) === 1);
  const pieces = unique.filter((p) => Number(p.website_synch) === 0);

  const db = knexFactory(knexConfig);
  try {
    await db.transaction(async (trx) => {
      for (const p of cards) {
        report.cards.total++;
        try {
          report.cards[await trx.transaction((sp) => importCard(sp, p, report))]++;
        } catch (e) {
          report.cards.failed++;
          report.failed.push({ kind: 'card', code: p.code, error: e.message });
        }
      }

      // ring cards by article, lowest code first (deterministic owner for shared SKUs)
      const rings = await trx({ p: 'products' })
        .join({ c: 'categories' }, 'c.id', 'p.category_id')
        .where('c.code', 'rings')
        .whereNotNull('p.article')
        .select('p.id', 'p.legacy_code', 'p.article')
        .orderByRaw("CASE WHEN p.legacy_code ~ '^[0-9]+$' THEN p.legacy_code::bigint END NULLS LAST, p.id");
      const ringsByArticle = new Map();
      for (const r of rings) {
        const k = normArticle(r.article);
        if (!ringsByArticle.has(k)) ringsByArticle.set(k, []);
        ringsByArticle.get(k).push(r);
      }

      for (const p of pieces) {
        report.pieces.total++;
        try {
          report.pieces[await trx.transaction((sp) => importPiece(sp, p, ringsByArticle, report))]++;
        } catch (e) {
          report.pieces.failed++;
          report.failed.push({ kind: 'piece', code: p.code, error: e.message });
        }
      }

      await trx('audit_logs').insert({
        action: DRY_RUN ? 'import.dntrade_api.dry_run' : 'import.dntrade_api',
        entity_type: 'import',
        after: JSON.stringify({ source, cards: summary(report.cards), pieces: summary(report.pieces) }),
      });
      if (DRY_RUN) throw Object.assign(new Error('dry run'), { dryRun: true });
    });
  } catch (e) {
    if (!e.dryRun) throw e;
  } finally {
    await db.destroy();
  }

  report.finished_at = new Date().toISOString();
  const dir = path.join(__dirname, 'reports');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `dntrade-api-${report.started_at.replace(/[:.]/g, '-')}${DRY_RUN ? '-dry-run' : ''}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));

  console.log(`${DRY_RUN ? '[DRY RUN — rolled back] ' : ''}DNTrade API import (${ENV}, ${source})`);
  console.log('cards :', summary(report.cards));
  console.log('pieces:', summary(report.pieces));
  console.log(`conflicts kept: ${report.conflicts.length} | failed: ${report.failed.length}`);
  console.log(`report: ${path.relative(ROOT, file)}`);
  if (report.failed.length) process.exitCode = 1;
}

function summary(section) {
  return Object.fromEntries(Object.entries(section).map(([k, v]) => [k, Array.isArray(v) ? v.length : v]));
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

module.exports = { parseSize, parseWeight, parsePrice, nonEmptyHtml };
