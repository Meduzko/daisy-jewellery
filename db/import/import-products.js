#!/usr/bin/env node
// Import DNTrade product CSV exports (products_db_dump/*.csv) into PostgreSQL.
//
//   npm run db:import:products                 # import + validate, write report
//   npm run db:import:products -- --dry-run    # same, then roll back
//   npm run db:import:products -- --dir=path/to/csvs --env=test   (default dir: db/products_csv)
//
// Rules: idempotent (match by products.legacy_code = CSV "Код"), one transaction
// with a savepoint per row, never deletes, never overwrites a non-empty value
// (it only fills empty fields; differing values are reported as conflicts).
// Optional columns (Роздрібна, #вставка, #виробник, #постачальник, #довжина, #розмір, #бейдж)
// are used when a file has them; values not present in the CSV are left NULL.

const fs = require('fs');
const path = require('path');
const knexFactory = require('knex');

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

const knexConfig = require(path.join(ROOT, 'knexfile.js'))[ENV];

// ---------------------------------------------------------------- reference data
// Category texts/URLs match the current storefront (src/helpers/menuItems.js, getProductLink.js).
const CATEGORIES = [
  { code: 'rings', file: 'каблучки', sort: 1,
    uk: { name: 'Каблучки', slug: 'kabluchki', url_prefix: 'kabluchki/kupyty-sribnu-kabluchku' },
    ru: { name: 'Кольца', slug: 'koltsa', url_prefix: 'koltsa/kupit-serebryanoye-koltso' } },
  { code: 'earrings', file: 'сережки', sort: 2,
    uk: { name: 'Сережки', slug: 'serezhky', url_prefix: 'serezhky/kupyty-serezhky-sribni' },
    ru: { name: 'Серьги', slug: 'sergi', url_prefix: 'sergi/kupit-serebryanyye-sergi' } },
  { code: 'necklaces', file: 'кольє', sort: 3,
    uk: { name: 'Кольє', slug: 'kolye', url_prefix: 'kolye/kupyty-sribne-kolye' },
    ru: { name: 'Колье', slug: 'kolye', url_prefix: 'kolye/kupit-serebryanoye-kolye' } },
  { code: 'bracelets', file: 'браслети', sort: 4,
    uk: { name: 'Браслети', slug: 'braslety', url_prefix: 'braslety/kupyty-sribnyy-braslet' },
    ru: { name: 'Браслеты', slug: 'braslety', url_prefix: 'braslety/kupit-serebryanyy-braslet' } },
];
// Filter definitions (architecture §3: insertion, metal, coating, color, manufacturer).
// Values are not in the CSV export, so none are created here.
const ATTRIBUTES = [
  { code: 'insertion', sort: 1, uk: 'Вставка', ru: 'Вставка' },
  { code: 'metal', sort: 2, uk: 'Метал', ru: 'Металл' },
  { code: 'coating', sort: 3, uk: 'Покриття', ru: 'Покрытие' },
  { code: 'color', sort: 4, uk: 'Колір', ru: 'Цвет' },
  { code: 'manufacturer', sort: 5, uk: 'Виробник', ru: 'Производитель' },
];
// #бейдж → collections (знижка/N is handled as sale_price).
const COLLECTIONS = [
  { code: 'new', badge: 'новинка', sort: 1, uk: { name: 'Новинки', slug: 'novynky' }, ru: { name: 'Новинки', slug: 'novinki' } },
  { code: 'popular', badge: 'популярне', sort: 2, uk: { name: 'Популярне', slug: 'populiarne' }, ru: { name: 'Популярное', slug: 'populyarnoe' } },
];
const LOCALES = [
  { code: 'uk', name: 'Українська', is_default: true, sort_order: 1 },
  { code: 'ru', name: 'Русский', is_default: false, sort_order: 2 },
];
const COLUMNS = {
  code: 'Код', title: 'Назва', image: 'Зображ.', article: 'Артикул', web: 'Веб', created: 'Створення',
  // optional
  price: 'Роздрібна', insertion: '#вставка', manufacturer: '#виробник', supplier: '#постачальник',
  length: '#довжина', size: '#розмір', badge: '#бейдж', note: 'Примітка',
};
const ATTRIBUTE_COLUMNS = { insertion: 'insertion', manufacturer: 'manufacturer' }; // column key → attributes.code
// Target fields with no source column in this export (reported, never invented).
const NOT_IN_SOURCE = [
  'products.legacy_id', 'product_translations(ru)', 'product_translations.description',
  'product_variants.weight_g/stock_qty/cost_price', 'attribute_values(metal, coating, color)',
];

// ---------------------------------------------------------------- helpers
function parseCsv(text, delimiter = ';') {
  text = text.replace(/^﻿/, '');
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...data] = rows.filter((r) => r.some((v) => v.trim() !== ''));
  return data.map((r, i) => ({ line: i + 2, ...Object.fromEntries(header.map((h, j) => [h.trim(), r[j] ?? ''])) }));
}

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i',
  й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh',
  ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ы: 'y', э: 'e', ё: 'e', ъ: '', "'": '', '’': '',
};
const slugify = (s) =>
  [...s.toLowerCase()].map((c) => TRANSLIT[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const clean = (v) => (v == null ? null : String(v).trim() || null);
const isNum = (v) => typeof v === 'number' || (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v));
const same = (a, b) => {
  if (a instanceof Date || b instanceof Date) return new Date(a).getTime() === new Date(b).getTime();
  if (isNum(a) && isNum(b)) return Number(a) === Number(b); // numeric(…) comes back as "16.00"
  return String(a) === String(b);
};

/**
 * Insert the row, or fill only its NULL columns. Non-null values that differ from
 * the source are kept and returned as conflicts.
 */
async function fillMissing(trx, table, where, values) {
  const existing = await trx(table).where(where).first();
  if (!existing) {
    const [row] = await trx(table).insert({ ...where, ...values }).returning('*');
    return { status: 'inserted', row, conflicts: [] };
  }
  const patch = {}, conflicts = [];
  for (const [k, v] of Object.entries(values)) {
    if (v == null) continue;
    if (existing[k] == null) patch[k] = v;
    else if (!same(existing[k], v)) conflicts.push({ field: `${table}.${k}`, db: existing[k], source: v });
  }
  if (Object.keys(patch).length) {
    patch.updated_at = trx.fn.now();
    const [row] = await trx(table).where(where).update(patch).returning('*');
    return { status: 'updated', row, conflicts };
  }
  return { status: 'unchanged', row: existing, conflicts };
}

// "1 250,00" → "1250.00"; anything else → undefined (invalid) / null (empty)
function parsePrice(v) {
  const t = clean(v)?.replace(/[\s\u00a0]/g, '').replace(',', '.');
  if (t == null) return null;
  return /^\d+(\.\d{1,2})?$/.test(t) && Number(t) > 0 ? Number(t).toFixed(2) : undefined;
}
// "16см" / "16,5см" / "17" → 16 / 16.5 / 17; ranges or "16см+" stay label-only.
function parseSize(label) {
  const m = label?.match(/^(\d+(?:[.,]\d+)?)\s*(см)?$/i);
  return m ? Number(m[1].replace(',', '.')) : null;
}
const normName = (s) => s.replace(/\s+/g, ' ').trim();

async function insertMissing(trx, table, where, values) {
  const hit = await trx(table).where(where).first();
  if (hit) return false;
  await trx(table).insert({ ...where, ...values });
  return true;
}

// ---------------------------------------------------------------- import
async function seedReferenceData(trx, report) {
  const ref = { inserted: 0 };
  for (const l of LOCALES) if (await insertMissing(trx, 'locales', { code: l.code }, l)) ref.inserted++;
  const categoryIds = {};
  for (const c of CATEGORIES) {
    const r = await fillMissing(trx, 'categories', { code: c.code }, { sort_order: c.sort });
    categoryIds[c.code] = r.row.id;
    if (r.status === 'inserted') ref.inserted++;
    for (const locale of ['uk', 'ru']) {
      const t = await fillMissing(trx, 'category_translations', { category_id: r.row.id, locale }, c[locale]);
      if (t.status === 'inserted') ref.inserted++;
    }
  }
  for (const a of ATTRIBUTES) {
    const r = await fillMissing(trx, 'attributes', { code: a.code }, { sort_order: a.sort });
    if (r.status === 'inserted') ref.inserted++;
    for (const locale of ['uk', 'ru']) {
      const t = await fillMissing(trx, 'attribute_translations', { attribute_id: r.row.id, locale }, { name: a[locale] });
      if (t.status === 'inserted') ref.inserted++;
    }
  }
  const collectionIds = {};
  for (const c of COLLECTIONS) {
    const r = await fillMissing(trx, 'collections', { code: c.code }, { sort_order: c.sort });
    collectionIds[c.badge] = r.row.id;
    if (r.status === 'inserted') ref.inserted++;
    for (const locale of ['uk', 'ru']) {
      const t = await fillMissing(trx, 'collection_translations', { collection_id: r.row.id, locale }, c[locale]);
      if (t.status === 'inserted') ref.inserted++;
    }
  }
  const attributeIds = Object.fromEntries((await trx('attributes').select('code', 'id')).map((a) => [a.code, a.id]));
  report.reference_data = { locales: LOCALES.length, categories: CATEGORIES.length, attributes: ATTRIBUTES.length, collections: COLLECTIONS.length, rows_inserted: ref.inserted };
  return { categoryIds, collectionIds, attributeIds };
}

function readSource(report) {
  const files = fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith('.csv')).sort();
  const records = [];
  for (const file of files) {
    const category = CATEGORIES.find((c) => file.toLowerCase().includes(`-${c.file}-`));
    const rows = parseCsv(fs.readFileSync(path.join(DIR, file), 'utf8'));
    report.files.push({ file, category: category?.code ?? null, rows: rows.length });
    for (const r of rows) records.push({ file, category, ...r });
  }
  return records;
}

function validateRecord(r, seen) {
  const code = clean(r[COLUMNS.code]);
  if (!r.category) return 'category not recognised from file name';
  if (!code) return 'missing Код';
  if (!/^\d+$/.test(code)) return `invalid Код "${code}"`;
  if (!clean(r[COLUMNS.title])) return 'missing Назва';
  if (seen.has(code)) return `duplicate Код (first in ${seen.get(code)})`;
  const created = clean(r[COLUMNS.created]);
  if (created && !/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/.test(created)) return `invalid Створення "${created}"`;
  const img = clean(r[COLUMNS.image]);
  if (img && !/^https?:\/\/\S+$/.test(img)) return `invalid Зображ. "${img}"`;
  return null;
}

async function importRecord(trx, r, ref, result) {
  const { categoryIds } = ref;
  const code = clean(r[COLUMNS.code]);
  const title = clean(r[COLUMNS.title]);
  const created = clean(r[COLUMNS.created]);
  let createdAt = null;
  if (created) {
    const [d, m, y, hm] = created.split(/[- ]/);
    // DNTrade times are Kyiv local time.
    createdAt = (await trx.raw("select (?::timestamp at time zone 'Europe/Kyiv') as t", [`${y}-${m}-${d} ${hm}`])).rows[0].t;
  }

  const warn = (field, message) => result.warnings.push({ code, field, message });

  // Price and "знижка/N" badge → sale_price (computed from the source price, rounded to kopecks)
  let price = parsePrice(r[COLUMNS.price]);
  if (price === undefined) { warn(COLUMNS.price, `invalid price "${r[COLUMNS.price]}" — not imported`); price = null; }
  const badges = (clean(r[COLUMNS.badge]) || '').split(/[,;]/).map((b) => b.trim().toLowerCase()).filter(Boolean);
  let salePrice = null;
  for (const b of badges) {
    const m = b.match(/^знижка\/(\d{1,2})$/);
    if (!m) continue;
    if (price) salePrice = (Math.round(Number(price) * (100 - Number(m[1]))) / 100).toFixed(2);
    else warn(COLUMNS.badge, `"${b}" without a price — sale price not set`);
  }

  // Supplier: exact match after trimming / case (no guessing between spellings)
  let supplierId = null;
  const supplierName = clean(r[COLUMNS.supplier]) && normName(r[COLUMNS.supplier]);
  if (supplierName) {
    const hit = await trx('suppliers').whereRaw('lower(name) = lower(?)', [supplierName]).first();
    supplierId = hit ? hit.id : (await trx('suppliers').insert({ name: supplierName }).returning('id'))[0].id;
    if (!hit) result.created.suppliers++;
  }

  const product = await fillMissing(trx, 'products', { legacy_code: code }, {
    category_id: categoryIds[r.category.code],
    price,
    sale_price: salePrice,
    supplier_id: supplierId,
    article: clean(r[COLUMNS.article]),
    source_created_at: createdAt,
    // status only on insert (NOT NULL default 'draft'): "Веб = Так" means it is on the website.
    ...(await trx('products').where({ legacy_code: code }).first() ? {} : { status: clean(r[COLUMNS.web]) === 'Так' ? 'active' : 'draft' }),
  });
  const id = product.row.id;
  const changes = [product.status];
  result.conflicts.push(...product.conflicts.map((c) => ({ code, ...c })));

  const tr = await fillMissing(trx, 'product_translations', { product_id: id, locale: 'uk' }, {
    title,
    slug: `${slugify(title)}-${code}`,
  });
  changes.push(tr.status);
  result.conflicts.push(...tr.conflicts.filter((c) => c.field.endsWith('.title')).map((c) => ({ code, ...c })));

  // Image and default variant only when the product has none — never re-add something an admin removed.
  const image = clean(r[COLUMNS.image]);
  if (image && !(await trx('product_images').where({ product_id: id }).first())) {
    await trx('product_images').insert({ product_id: id, url: image, sort_order: 0 });
    changes.push('updated');
  }
  const length = clean(r[COLUMNS.length]), sizeCol = clean(r[COLUMNS.size]);
  const sizeLabel = length || sizeCol; // bracelets/necklaces: length; rings: size
  if (length && sizeCol && length !== sizeCol) warn(COLUMNS.size, `both ${COLUMNS.length} "${length}" and ${COLUMNS.size} "${sizeCol}" — used ${COLUMNS.length}`);
  const variants = await trx('product_variants').where({ product_id: id });
  if (!variants.length) {
    await trx('product_variants').insert({ product_id: id, size_label: sizeLabel, size: parseSize(sizeLabel) });
    changes.push('updated');
  } else if (sizeLabel && variants.length === 1) {
    const v = await fillMissing(trx, 'product_variants', { id: variants[0].id }, { size_label: sizeLabel, size: parseSize(sizeLabel) });
    changes.push(v.status);
    result.conflicts.push(...v.conflicts.map((c) => ({ code, ...c })));
  } else if (sizeLabel) warn(COLUMNS.length, `product has ${variants.length} variants — size "${sizeLabel}" not applied`);

  // Attributes (#вставка, #виробник): value matched by slug within the attribute; links only added
  for (const [col, attrCode] of Object.entries(ATTRIBUTE_COLUMNS)) {
    const value = clean(r[COLUMNS[col]]) && normName(r[COLUMNS[col]]);
    if (!value) continue;
    const attributeId = ref.attributeIds[attrCode];
    const slug = slugify(value);
    let av = await trx('attribute_values').where({ attribute_id: attributeId, slug }).first();
    if (!av) {
      av = (await trx('attribute_values').insert({ attribute_id: attributeId, slug }).returning('*'))[0];
      await trx('attribute_value_translations').insert({ attribute_value_id: av.id, locale: 'uk', value });
      result.created.attribute_values++;
    }
    if (await insertMissing(trx, 'product_attribute_values', { product_id: id, attribute_value_id: av.id }, {})) changes.push('updated');
  }

  // Collections from badges
  for (const b of badges) {
    if (/^знижка\//.test(b)) continue;
    const collectionId = ref.collectionIds[b];
    if (!collectionId) { warn(COLUMNS.badge, `unknown badge "${b}"`); continue; }
    if (await insertMissing(trx, 'collection_products', { collection_id: collectionId, product_id: id }, {})) changes.push('updated');
  }
  if (clean(r[COLUMNS.note])) warn(COLUMNS.note, 'note present — not mapped');

  return product.status === 'inserted' ? 'inserted' : changes.some((s) => s !== 'unchanged') ? 'updated' : 'unchanged';
}

// ---------------------------------------------------------------- validation
async function validate(trx, records, report) {
  const v = { checked: 0, ok: 0, problems: [] };
  for (const r of records) {
    if (r.invalid) continue;
    v.checked++;
    const code = clean(r[COLUMNS.code]);
    const p = await trx('products as p').join('categories as c', 'c.id', 'p.category_id')
      .where('p.legacy_code', code).first('p.*', 'c.code as category_code');
    const issues = [];
    if (!p) issues.push('product missing');
    else {
      const uk = await trx('product_translations').where({ product_id: p.id, locale: 'uk' }).first();
      const ru = await trx('product_i18n').where({ product_id: p.id, locale: 'ru' }).first();
      const images = (await trx('product_images').where({ product_id: p.id }).pluck('url'));
      const variants = await trx('product_variants').where({ product_id: p.id }).count('* as n').first();
      if (p.category_code !== r.category.code) issues.push(`category ${p.category_code} ≠ ${r.category.code}`);
      if (uk?.title !== clean(r[COLUMNS.title])) issues.push('uk title differs');
      if ((p.article ?? null) !== clean(r[COLUMNS.article])) issues.push('article differs');
      if (clean(r[COLUMNS.image]) && !images.includes(clean(r[COLUMNS.image]))) issues.push('image missing');
      if (Number(variants.n) < 1) issues.push('no variant');
      if (!ru?.title) issues.push('ru fallback missing');
      const price = parsePrice(r[COLUMNS.price]);
      if (price && p.price !== price) issues.push(`price ${p.price} ≠ ${price}`);
      for (const [col, attrCode] of Object.entries(ATTRIBUTE_COLUMNS)) {
        const value = clean(r[COLUMNS[col]]);
        if (!value) continue;
        const linked = await trx('product_attribute_values as pav')
          .join('attribute_values as av', 'av.id', 'pav.attribute_value_id').join('attributes as a', 'a.id', 'av.attribute_id')
          .where({ 'pav.product_id': p.id, 'a.code': attrCode, 'av.slug': slugify(normName(value)) }).first();
        if (!linked) issues.push(`${attrCode} "${value}" not linked`);
      }
      const supplier = clean(r[COLUMNS.supplier]);
      if (supplier) {
        const s = p.supplier_id && (await trx('suppliers').where({ id: p.supplier_id }).first());
        if (!s || s.name.toLowerCase() !== normName(supplier).toLowerCase()) issues.push('supplier differs');
      }
      const sizeLabel = clean(r[COLUMNS.length]) || clean(r[COLUMNS.size]);
      if (sizeLabel && !(await trx('product_variants').where({ product_id: p.id, size_label: sizeLabel }).first())) issues.push('size missing');
    }
    if (issues.length) v.problems.push({ code, file: r.file, issues });
    else v.ok++;
  }
  const codes = records.filter((r) => !r.invalid).map((r) => clean(r[COLUMNS.code]));
  v.db_products_with_source_codes = Number((await trx('products').whereIn('legacy_code', codes).count('* as n').first()).n);
  v.db_products_total = Number((await trx('products').count('* as n').first()).n);
  v.per_category = Object.fromEntries((await trx('products as p').join('categories as c', 'c.id', 'p.category_id')
    .whereIn('p.legacy_code', codes).groupBy('c.code').select('c.code').count('* as n')).map((x) => [x.code, Number(x.n)]));
  v.source_per_category = records.filter((r) => !r.invalid).reduce((a, r) => ({ ...a, [r.category.code]: (a[r.category.code] || 0) + 1 }), {});
  report.validation = v;
}

// ---------------------------------------------------------------- main
async function main() {
  if (process.env.NODE_ENV === 'production' || ENV === 'production') {
    throw new Error('Refusing to run against production. This importer is for local/staging databases.');
  }
  const report = {
    started_at: new Date().toISOString(), env: ENV, dry_run: DRY_RUN, source_dir: path.relative(ROOT, DIR), files: [],
    totals: { total: 0, inserted: 0, updated: 0, skipped: 0, failed: 0 },
    missing_source_values: {}, not_in_source: NOT_IN_SOURCE, skipped: [], failed: [], conflicts: [], warnings: [],
    created: { suppliers: 0, attribute_values: 0 },
  };
  const records = readSource(report);
  report.totals.total = records.length;
  for (const col of Object.values(COLUMNS)) {
    const having = records.filter((r) => col in r);
    if (having.length) report.missing_source_values[col] = `${having.filter((r) => !clean(r[col])).length} empty of ${having.length} rows having the column`;
  }

  const db = knexFactory(knexConfig);
  try {
    await db.transaction(async (trx) => {
      const ref = await seedReferenceData(trx, report);
      const seen = new Map();
      for (const r of records) {
        const reason = validateRecord(r, seen);
        if (reason) {
          r.invalid = true;
          report.totals.skipped++;
          report.skipped.push({ file: r.file, line: r.line, code: r[COLUMNS.code], reason });
          continue;
        }
        seen.set(clean(r[COLUMNS.code]), r.file);
        const result = { conflicts: [], warnings: [], created: report.created };
        try {
          const status = await trx.transaction((sp) => importRecord(sp, r, ref, result)); // savepoint
          if (status === 'unchanged') report.totals.skipped++;
          else report.totals[status]++;
          report.conflicts.push(...result.conflicts);
          report.warnings.push(...result.warnings);
        } catch (e) {
          report.totals.failed++;
          report.failed.push({ file: r.file, line: r.line, code: r[COLUMNS.code], error: e.message });
        }
      }
      await validate(trx, records, report);
      await trx('audit_logs').insert({
        action: DRY_RUN ? 'import.products.dry_run' : 'import.products', entity_type: 'import',
        after: JSON.stringify({ totals: report.totals, files: report.files }),
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
  const file = path.join(dir, `products-${report.started_at.replace(/[:.]/g, '-')}${DRY_RUN ? '-dry-run' : ''}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));

  const t = report.totals, v = report.validation;
  console.log(`${DRY_RUN ? '[DRY RUN — rolled back] ' : ''}Products import (${ENV})`);
  console.table(report.files.map((f) => ({ file: f.file, category: f.category, rows: f.rows })));
  console.log(`total ${t.total} | inserted ${t.inserted} | updated ${t.updated} | skipped ${t.skipped} | failed ${t.failed} | conflicts kept ${report.conflicts.length} | warnings ${report.warnings.length}`);
  console.log('created:', report.created);
  console.log('empty source values:', report.missing_source_values);
  console.log('not in source (left NULL):', NOT_IN_SOURCE.join(', '));
  console.log(`validation: ${v.ok}/${v.checked} rows match DB; ${v.problems.length} with differences; per category`, v.per_category);
  console.log(`report: ${path.relative(ROOT, file)}`);
  if (t.failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
