#!/usr/bin/env node
// Push the owner's product content into an existing database (overwrite).
// Source (default db/products_csv): the four DNTrade exports «Товари-<категорія>-…csv» into which
// the owner's sheets were merged on 2026-11-12 (Назва, Опис, #вставка, Колір вставки, Матеріал,
// Покриття, Середня вага, #довжина, Тип застібки). The original sheets — kept in
// a separate folder — can still be read with --dir=… (column names
// «Нова назва (SEO)», «Опис товару (SEO)», «Вставка», «Розмір браслета», «Тип защібки», «Ціна»).
//
//   npm run db:import:content                  # import + validate, write report
//   npm run db:import:content -- --dry-run     # same, then roll back
//   npm run db:import:content -- --dir=path/to/csvs --env=test   (default dir: db/products_csv)
//   npm run db:import:content -- --update-prices   # also OVERWRITE products.price from «Ціна»
//        (sale_price is recomputed from «#бейдж» знижка/N; without a badge an existing sale_price
//         is kept and reported as a warning). Previous prices → report + audit log.
//
// Run after db:patch:specs (existing DB) or db:migrate (new DB) and the other imports.
// Unlike the DNTrade importers this one is AUTHORITATIVE for the content it carries —
// the sheets are the owner's edited texts — so it overwrites:
//   «Нова назва (SEO)» / «Нова назва» → product_translations(uk).title (slug and URL unchanged)
//   «Опис товару (SEO)»               → product_translations(uk).description; the old DNTrade
//                                        short_description is cleared (it would repeat the text)
//   «Середня вага»                    → products.avg_weight_g
//   «Вставка», «Колір вставки», «Матеріал», «Покриття», «Тип защібки»
//                                     → attributes insertion, insertion_color, metal, coating, clasp
//                                        (multi-values split on , ; — spelling variants normalised,
//                                        see VALUES; the product's links of that attribute are replaced)
//   «Розмір браслета» / «Розмір»      → size_label (+ numeric size when single) of the only variant
//   «Примітка» (merged exports only)  → products.note (needs migration 20261113000001)
// A cell that is empty or «Same» keeps the current value. Previous values are written to the
// report and the audit log (before/after), so every change can be traced and reverted.
// Fill-only / report-only: «Ціна» (filled when the DB has no price, differences reported),
// «Артикул» (Sheets dropped trailing zeros, e.g. 1325,20 → 1325,2 — never imported), images.
// Cards are matched by products.legacy_code = «Код» and never created; ru texts are not touched.

const fs = require('fs');
const path = require('path');
const knexFactory = require('knex');
const { ATTRIBUTES } = require('../reference/attributes');

const ROOT = path.resolve(__dirname, '../..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  })
);
const ENV = args.env || 'development';
const DIR = path.resolve(ROOT, args.dir || 'db/products_csv');
const DRY_RUN = Boolean(args['dry-run']);
const UPDATE_PRICES = Boolean(args['update-prices']);

// ---------------------------------------------------------------- source format
const CATEGORY_BY_FILE = [
  { re: /каблучк/, code: 'rings' },
  { re: /сережк/, code: 'earrings' },
  { re: /кольє/, code: 'necklaces' },
  { re: /браслет/, code: 'bracelets' },
];
// field → accepted header names (trimmed), first present wins
// (first names: the owner's sheets; last names: the merged DNTrade export files
//  «Товари-<категорія>-…csv» that now carry the same content, see db/README.md)
const COLUMNS = {
  code: ['Код'],
  title: ['Нова назва (SEO)', 'Нова назва', 'Назва'],
  description: ['Опис товару (SEO)', 'Опис'],
  price: ['Ціна', 'Роздрібна'], // site price; «Роздрібна» only for files without «Ціна»
  article: ['Артикул'],
  badge: ['#бейдж'],
  weight: ['Середня вага'],
  size: ['Розмір браслета', 'Розмір', '#довжина'],
  insertion: ['Вставка', '#вставка'],
  insertion_color: ['Колір вставки'],
  metal: ['Матеріал'],
  coating: ['Покриття'],
  clasp: ['Тип защібки', 'Тип застібки'],
  note: ['Примітка'], // → products.note (migration 20261113000001); only in the merged DNTrade exports
};
const ATTRIBUTE_FIELDS = ['insertion', 'insertion_color', 'metal', 'coating', 'clasp'];
const REQUIRED = ['code', 'title', 'description'];

const {
  parseCsv, oneLine, isKeep, cleanText, parseWeight, parsePrice, normSizeLabel, parseSize, same, parseValues,
} = require('./lib/catalog-values');

// ---------------------------------------------------------------- source
function readSource(report) {
  const files = fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith('.csv')).sort();
  const records = [];
  for (const file of files) {
    const name = file.normalize('NFC').toLowerCase();
    const text = fs.readFileSync(path.join(DIR, file), 'utf8');
    const { header, rows } = parseCsv(text);
    const pick = (field) => COLUMNS[field].find((h) => header.includes(h)) || null;
    const columns = Object.fromEntries(Object.keys(COLUMNS).map((f) => [f, pick(f)]));
    if (REQUIRED.some((f) => !columns[f])) { report.ignored_files.push(file); continue; } // not a content sheet
    const category = CATEGORY_BY_FILE.find((c) => c.re.test(name))?.code || null;
    report.files.push({ file, category, rows: rows.length, columns: Object.fromEntries(Object.entries(columns).filter(([, h]) => h)) });
    for (const r of rows) {
      const get = (f) => (columns[f] ? r[columns[f]] : undefined);
      records.push({ file, line: r.line, category, columns, get });
    }
  }
  return records;
}

// ---------------------------------------------------------------- import
async function ensureAttributes(trx) {
  const ids = {};
  for (const a of ATTRIBUTES) {
    let row = await trx('attributes').where({ code: a.code }).first();
    if (!row) [row] = await trx('attributes').insert({ code: a.code, sort_order: a.sort }).returning('*');
    for (const locale of ['uk', 'ru']) {
      await trx('attribute_translations').insert({ attribute_id: row.id, locale, name: a[locale] })
        .onConflict(['attribute_id', 'locale']).ignore();
    }
    ids[a.code] = row.id;
  }
  return ids;
}

/** Find or create the attribute value; canonical uk/ru texts + sort order are (re)applied. */
async function upsertValue(trx, attributeId, v, report) {
  let av = await trx('attribute_values').where({ attribute_id: attributeId, slug: v.slug }).first();
  if (!av) {
    [av] = await trx('attribute_values').insert({ attribute_id: attributeId, slug: v.slug, sort_order: v.sort }).returning('*');
    report.created.attribute_values++;
  } else if (v.known && av.sort_order !== v.sort) {
    await trx('attribute_values').where({ id: av.id }).update({ sort_order: v.sort, updated_at: trx.fn.now() });
  }
  for (const [locale, value] of [['uk', v.uk], ['ru', v.ru]]) {
    if (!value) continue;
    const t = await trx('attribute_value_translations').where({ attribute_value_id: av.id, locale }).first();
    if (!t) await trx('attribute_value_translations').insert({ attribute_value_id: av.id, locale, value });
    else if (v.known && t.value !== value) {
      await trx('attribute_value_translations').where({ attribute_value_id: av.id, locale }).update({ value, updated_at: trx.fn.now() });
    }
  }
  return av.id;
}

async function importRecord(trx, rec, ctx, result) {
  const code = oneLine(rec.get('code'));
  const warn = (field, message) => result.warnings.push({ code, field, message });
  const change = (field, before, after) => result.changes.push({ code, field, before, after });

  const product = await trx('products as p').join('categories as c', 'c.id', 'p.category_id')
    .where('p.legacy_code', code).first('p.*', 'c.code as category_code');
  if (!product) return { status: 'skipped', reason: 'Код not in DB (cards are never created here)' };
  if (rec.category && product.category_code !== rec.category) warn('category', `DB category ${product.category_code} ≠ file ${rec.category}`);
  const id = product.id;

  // ---- uk texts
  const uk = await trx('product_translations').where({ product_id: id, locale: 'uk' }).first();
  const textPatch = {};
  const title = rec.get('title');
  if (!isKeep(title)) {
    const v = oneLine(title);
    if (v !== uk?.title) { textPatch.title = v; change('title', uk?.title ?? null, v); }
  }
  const description = rec.get('description');
  if (!isKeep(description)) {
    const v = cleanText(description);
    if (v !== uk?.description) { textPatch.description = v; change('description', uk?.description ?? null, v); }
    if (uk?.short_description != null) { textPatch.short_description = null; change('short_description', uk.short_description, null); }
  }
  if (Object.keys(textPatch).length) {
    if (!uk) warn('title', 'no uk translation row — texts not applied');
    else await trx('product_translations').where({ product_id: id, locale: 'uk' }).update({ ...textPatch, updated_at: trx.fn.now() });
  }

  // ---- product columns
  const productPatch = {};
  const weightCell = rec.get('weight');
  if (weightCell !== undefined && !isKeep(weightCell)) {
    const w = parseWeight(weightCell);
    if (w === undefined) warn('weight', `invalid weight "${oneLine(weightCell)}" — not imported`);
    else if (!same(product.avg_weight_g, w)) { productPatch.avg_weight_g = w; change('avg_weight_g', product.avg_weight_g, w); }
  }
  const priceCell = rec.get('price');
  if (priceCell !== undefined && !isKeep(priceCell)) {
    const p = parsePrice(priceCell);
    if (p === undefined) warn('price', `invalid price "${oneLine(priceCell)}"`);
    else if (product.price == null || (UPDATE_PRICES && !same(product.price, p))) {
      productPatch.price = p; change('price', product.price ?? null, p);
      if (UPDATE_PRICES) {
        const m = /знижка\s*\/\s*(\d+(?:[.,]\d+)?)/i.exec(oneLine(rec.get('badge') || ''));
        if (m) {
          const sale = (Math.round(Number(p) * (100 - Number(m[1].replace(',', '.')))) / 100).toFixed(2);
          if (!same(product.sale_price, sale)) { productPatch.sale_price = sale; change('sale_price', product.sale_price ?? null, sale); }
        } else if (product.sale_price != null) {
          warn('sale_price', `price changed to ${p} but sale_price ${product.sale_price} kept (no «знижка/N» in #бейдж) — the site shows sale_price`);
        }
      }
    }
    else if (!same(product.price, p)) result.conflicts.push({ code, field: 'products.price', db: product.price, source: p });
  }
  const noteCell = rec.get('note');
  if (noteCell !== undefined && !isKeep(noteCell)) {
    const n = cleanText(noteCell);
    if (n !== (product.note ?? null)) { productPatch.note = n; change('note', product.note ?? null, n); }
  }
  if (Object.keys(productPatch).length) await trx('products').where({ id }).update({ ...productPatch, updated_at: trx.fn.now() });
  const article = oneLine(rec.get('article'));
  if (article && article !== oneLine(product.article)) result.article_differences.push({ code, db: product.article, sheet: article });

  // ---- size / length of the only variant
  const sizeCell = rec.get('size');
  if (sizeCell !== undefined && !isKeep(sizeCell)) {
    const label = normSizeLabel(sizeCell);
    const variants = await trx('product_variants').where({ product_id: id }).orderBy('id');
    if (variants.length === 1) {
      const v = variants[0], size = parseSize(label);
      if (v.size_label !== label || !same(v.size, size)) {
        await trx('product_variants').where({ id: v.id }).update({ size_label: label, size, updated_at: trx.fn.now() });
        change('size_label', v.size_label, label);
      }
    } else warn('size', `product has ${variants.length} variants — "${label}" not applied`);
  }

  // ---- attributes: the sheet's values replace this attribute's links
  for (const field of ATTRIBUTE_FIELDS) {
    const cell = rec.get(field);
    if (cell === undefined || isKeep(cell)) continue;
    const attributeId = ctx.attributeIds[field];
    const values = parseValues(field, cell, warn);
    const wanted = [];
    for (const v of values) wanted.push(await upsertValue(trx, attributeId, v, ctx.report));
    const current = await trx('product_attribute_values as pav').join('attribute_values as av', 'av.id', 'pav.attribute_value_id')
      .where({ 'pav.product_id': id, 'av.attribute_id': attributeId }).pluck('av.id');
    const remove = current.filter((x) => !wanted.includes(x));
    const add = wanted.filter((x) => !current.includes(x));
    if (!remove.length && !add.length) continue;
    if (remove.length) await trx('product_attribute_values').where({ product_id: id }).whereIn('attribute_value_id', remove).del();
    if (add.length) await trx('product_attribute_values').insert(add.map((x) => ({ product_id: id, attribute_value_id: x })));
    const label = async (ids) => (await trx('attribute_value_translations').whereIn('attribute_value_id', ids).where('locale', 'uk').pluck('value')).sort().join(', ') || null;
    change(field, await label(current), values.map((v) => v.uk).join(', '));
  }

  return { status: result.changes.length ? 'updated' : 'unchanged' };
}

// ---------------------------------------------------------------- validation
async function validate(trx, records, report) {
  const v = { checked: 0, ok: 0, problems: [] };
  for (const rec of records) {
    if (rec.status !== 'updated' && rec.status !== 'unchanged') continue;
    v.checked++;
    const code = oneLine(rec.get('code'));
    const issues = [];
    const p = await trx('products').where('legacy_code', code).first();
    const uk = await trx('product_translations').where({ product_id: p.id, locale: 'uk' }).first();
    if (!isKeep(rec.get('title')) && uk.title !== oneLine(rec.get('title'))) issues.push('title differs');
    if (!isKeep(rec.get('description'))) {
      if (uk.description !== cleanText(rec.get('description'))) issues.push('description differs');
      if (uk.short_description != null) issues.push('short_description not cleared');
    }
    const w = rec.get('weight') !== undefined && !isKeep(rec.get('weight')) ? parseWeight(rec.get('weight')) : null;
    if (w && !same(p.avg_weight_g, w)) issues.push(`avg weight ${p.avg_weight_g} ≠ ${w}`);
    const noteCell = rec.get('note');
    if (noteCell !== undefined && !isKeep(noteCell) && p.note !== cleanText(noteCell)) issues.push('note differs');
    const priceCell = rec.get('price');
    if (UPDATE_PRICES && priceCell !== undefined && !isKeep(priceCell) && parsePrice(priceCell) && !same(p.price, parsePrice(priceCell))) {
      issues.push(`price ${p.price} ≠ ${parsePrice(priceCell)}`);
    }
    for (const field of ATTRIBUTE_FIELDS) {
      const cell = rec.get(field);
      if (cell === undefined || isKeep(cell)) continue;
      const expected = parseValues(field, cell, () => {}).map((x) => x.slug).sort();
      const actual = (await trx('product_attribute_values as pav').join('attribute_values as av', 'av.id', 'pav.attribute_value_id')
        .join('attributes as a', 'a.id', 'av.attribute_id').where({ 'pav.product_id': p.id, 'a.code': field }).pluck('av.slug')).sort();
      if (expected.join() !== actual.join()) issues.push(`${field} [${actual}] ≠ [${expected}]`);
    }
    if (issues.length) v.problems.push({ code, file: rec.file, issues });
    else v.ok++;
  }
  const codes = records.map((r) => oneLine(r.get('code')));
  v.db_cards_not_in_sheets = await trx('products as p').join('categories as c', 'c.id', 'p.category_id')
    .whereNotIn('p.legacy_code', codes).select('p.legacy_code as code', 'c.code as category', 'p.status');
  v.orphan_attribute_values = await trx('attribute_values as av').join('attributes as a', 'a.id', 'av.attribute_id')
    .leftJoin('attribute_value_translations as t', function onT() { this.on('t.attribute_value_id', 'av.id').andOn('t.locale', trx.raw('?', ['uk'])); })
    .whereNotExists(trx('product_attribute_values as pav').whereRaw('pav.attribute_value_id = av.id'))
    .select('a.code as attribute', 'av.slug', 't.value');
  report.validation = v;
}

// ---------------------------------------------------------------- main
async function main() {
  if (process.env.NODE_ENV === 'production' || ENV === 'production') {
    throw new Error('Refusing to run against production. This importer is for local/staging databases.');
  }
  const report = {
    started_at: new Date().toISOString(), env: ENV, dry_run: DRY_RUN, update_prices: UPDATE_PRICES, source_dir: path.relative(ROOT, DIR),
    files: [], ignored_files: [],
    totals: { total: 0, updated: 0, unchanged: 0, skipped: 0, failed: 0 },
    changed_fields: {}, created: { attribute_values: 0 },
    skipped: [], failed: [], conflicts: [], warnings: [], article_differences: [], changes: [],
  };
  const records = readSource(report);
  report.totals.total = records.length;

  const db = knexFactory(require(path.join(ROOT, 'knexfile.js'))[ENV]);
  try {
    await db.transaction(async (trx) => {
      if (!(await trx.schema.hasColumn('products', 'avg_weight_g'))) {
        throw new Error('products.avg_weight_g is missing — run `npm run db:patch:specs` first (existing DB) or `npm run db:migrate` (new DB).');
      }
      if (!(await trx.schema.hasColumn('products', 'note'))) {
        throw new Error('products.note is missing — run `npm run db:migrate` first (migration 20261113000001).');
      }
      const ctx = { attributeIds: await ensureAttributes(trx), report };
      const seen = new Map();
      for (const rec of records) {
        const code = oneLine(rec.get('code'));
        let reason = null;
        if (!/^\d+$/.test(code)) reason = `invalid Код "${code}"`;
        else if (seen.has(code)) reason = `duplicate Код (first in ${seen.get(code)})`;
        if (reason) {
          rec.status = 'skipped'; report.totals.skipped++;
          report.skipped.push({ file: rec.file, line: rec.line, code, reason });
          continue;
        }
        seen.set(code, rec.file);
        const result = { changes: [], conflicts: [], warnings: [], article_differences: [] };
        try {
          const r = await trx.transaction((sp) => importRecord(sp, rec, ctx, result)); // savepoint
          rec.status = r.status;
          report.totals[r.status]++;
          if (r.status === 'skipped') report.skipped.push({ file: rec.file, line: rec.line, code, reason: r.reason });
          for (const k of ['changes', 'conflicts', 'warnings', 'article_differences']) report[k].push(...result[k]);
        } catch (e) {
          rec.status = 'failed'; report.totals.failed++;
          report.failed.push({ file: rec.file, line: rec.line, code, error: e.message });
        }
      }
      for (const c of report.changes) report.changed_fields[c.field] = (report.changed_fields[c.field] || 0) + 1;
      await validate(trx, records, report);
      await trx('audit_logs').insert({
        action: DRY_RUN ? 'import.product_content.dry_run' : 'import.product_content', entity_type: 'import',
        before: JSON.stringify(report.changes.map(({ code, field, before }) => ({ code, field, before }))),
        after: JSON.stringify({ totals: report.totals, files: report.files.map((f) => f.file), changed_fields: report.changed_fields }),
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
  const file = path.join(dir, `content-${report.started_at.replace(/[:.]/g, '-')}${DRY_RUN ? '-dry-run' : ''}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));

  const t = report.totals, v = report.validation;
  console.log(`${DRY_RUN ? '[DRY RUN — rolled back] ' : ''}Product content import (${ENV})`);
  console.table(report.files.map((f) => ({ file: f.file, category: f.category, rows: f.rows })));
  if (report.ignored_files.length) console.log('ignored (not content sheets):', report.ignored_files.join(' | '));
  console.log(`total ${t.total} | updated ${t.updated} | unchanged ${t.unchanged} | skipped ${t.skipped} | failed ${t.failed}`);
  console.log('changed fields:', report.changed_fields);
  console.log(`created attribute values: ${report.created.attribute_values} | price conflicts kept: ${report.conflicts.length} | warnings: ${report.warnings.length} | article differences (not imported): ${report.article_differences.length}`);
  console.log(`validation: ${v.ok}/${v.checked} rows match DB; ${v.problems.length} with differences`);
  console.log('DB cards not in the sheets (untouched):', v.db_cards_not_in_sheets.map((c) => `${c.code} (${c.category})`).join(', ') || '—');
  console.log(`report: ${path.relative(ROOT, file)}`);
  if (t.failed || v.problems.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
