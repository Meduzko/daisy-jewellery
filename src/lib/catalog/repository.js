// Catalog queries (Knex + PostgreSQL). Pure data access: every function takes the
// Knex instance as its first argument, so it runs in Server Components (via
// ./index.js, which adds caching) and in plain Node tests.
//
// Storefront visibility rule (docs/database/architecture.md §5):
//   product.status = 'active', category active, price present.
// Texts come from product_i18n / category_i18n / attribute*_i18n, which fall back
// to the default locale (uk) when a translation or a single field is missing.

import { mapProduct, mapVariant } from './mapper.js';
import { toCategoryDbCode } from './categories.js';

export const LOCALES = ['uk', 'ru'];
export const DEFAULT_LOCALE = 'uk';
export const SORTS = ['default', 'newest', 'price_asc', 'price_desc', 'title'];
export const MAX_LIMIT = 100;

export const normalizeLocale = (locale) => (LOCALES.includes(locale) ? locale : DEFAULT_LOCALE);

const clampLimit = (limit, fallback = 16) => {
  const n = Number.parseInt(limit, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, MAX_LIMIT);
};
const clampOffset = (offset) => {
  const n = Number.parseInt(offset, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

const EFFECTIVE_PRICE = 'COALESCE(p.sale_price, p.price)';
// DNTrade listed cards by numeric code; keep that as the default order.
const CODE_ORDER = "CASE WHEN p.legacy_code ~ '^[0-9]+$' THEN p.legacy_code::bigint END";

/** Base query: visible products with localized texts, images and collection codes. */
function baseQuery(db, locale) {
  return db({ p: 'products' })
    .join({ c: 'categories' }, function joinCategory() {
      this.on('c.id', 'p.category_id').andOn(db.raw('c.is_active'));
    })
    .join({ i: 'product_i18n' }, function joinI18n() {
      this.on('i.product_id', 'p.id').andOn('i.locale', db.raw('?', [locale]));
    })
    .where('p.status', 'active')
    .whereNotNull('p.price');
}

function selectProduct(db, qb) {
  return qb.select(
    'p.id', 'p.legacy_id', 'p.legacy_code', 'p.article', 'p.price', 'p.sale_price',
    'p.source_created_at', 'p.updated_at', 'c.code as category_code',
    'i.locale', 'i.title', 'i.slug', 'i.short_description', 'i.description',
    'i.seo_title', 'i.seo_description', 'i.is_fallback',
    db.raw(`ARRAY(SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id
                  ORDER BY pi.sort_order, pi.id) AS images`),
    db.raw(`ARRAY(SELECT co.code FROM collection_products cp
                  JOIN collections co ON co.id = cp.collection_id AND co.is_active
                  WHERE cp.product_id = p.id ORDER BY co.sort_order, co.id) AS collection_codes`)
  );
}

/**
 * Filters shared by listing, counting and search.
 * @param {object} f
 * @param {string} [f.category]     storefront key ('ring') or DB code ('rings')
 * @param {string} [f.collection]   collections.code ('popular', 'new', …)
 * @param {Record<string,string[]>} [f.attributes]  { insertion: ['onyx'] } (attribute code → value slugs)
 * @param {number} [f.priceMin] / [f.priceMax]  on the effective (sale) price
 * @param {boolean} [f.inStock]     at least one variant with stock NULL (untracked) or > 0
 * @param {number[]} [f.sizes]      at least one in-stock variant of one of these sizes
 * @param {string} [f.q]            search text (every word must match title, uk title, article or code)
 * @param {string[]} [f.codes]      restrict to these product codes
 * @param {number} [f.excludeId]
 */
function applyFilters(db, qb, f = {}) {
  if (f.category) {
    const code = toCategoryDbCode(f.category);
    qb.where('c.code', code || '__none__');
  }
  if (f.collection) {
    qb.whereExists(
      db.select(1).from({ cp: 'collection_products' })
        .join({ co: 'collections' }, 'co.id', 'cp.collection_id')
        .whereRaw('cp.product_id = p.id').andWhere('co.code', f.collection).andWhere('co.is_active', true)
    );
  }
  for (const [attribute, slugs] of Object.entries(f.attributes || {})) {
    const values = [].concat(slugs || []).map(String).filter(Boolean);
    if (!values.length) continue;
    qb.whereExists(
      db.select(1).from({ pav: 'product_attribute_values' })
        .join({ av: 'attribute_values' }, 'av.id', 'pav.attribute_value_id')
        .join({ a: 'attributes' }, 'a.id', 'av.attribute_id')
        .whereRaw('pav.product_id = p.id').andWhere('a.code', attribute).whereIn('av.slug', values)
    );
  }
  if (f.priceMin != null && Number.isFinite(Number(f.priceMin))) qb.whereRaw(`${EFFECTIVE_PRICE} >= ?`, [Number(f.priceMin)]);
  if (f.priceMax != null && Number.isFinite(Number(f.priceMax))) qb.whereRaw(`${EFFECTIVE_PRICE} <= ?`, [Number(f.priceMax)]);
  if (f.inStock) {
    qb.whereExists(
      db.select(1).from({ v: 'product_variants' })
        .whereRaw('v.product_id = p.id AND (v.stock_qty IS NULL OR v.stock_qty > 0)')
    );
  }
  const sizes = [].concat(f.sizes || []).map(Number).filter(Number.isFinite);
  if (sizes.length) {
    qb.whereExists(
      db.select(1).from({ v: 'product_variants' })
        .whereRaw('v.product_id = p.id AND (v.stock_qty IS NULL OR v.stock_qty > 0)')
        .whereIn('v.size', sizes)
    );
  }
  if (f.codes) qb.whereIn('p.legacy_code', f.codes.map(String));
  if (f.excludeId) qb.whereNot('p.id', f.excludeId);

  const words = String(f.q || '').trim().toLowerCase().split(/\s+/).filter(Boolean).slice(0, 8);
  for (const word of words) {
    const like = `%${escapeLike(word)}%`;
    qb.where(function matchWord() {
      this.whereRaw('i.title ILIKE ?', [like])
        .orWhereExists(
          db.select(1).from({ dt: 'product_translations' })
            .join({ dl: 'locales' }, function onDefault() { this.on('dl.code', 'dt.locale').andOn(db.raw('dl.is_default')); })
            .whereRaw('dt.product_id = p.id AND dt.title ILIKE ?', [like])
        )
        .orWhereRaw('p.article ILIKE ?', [like])
        .orWhere('p.legacy_code', word);
    });
  }
  return qb;
}

function applySort(db, qb, sort) {
  switch (sort) {
    case 'newest':
      return qb.orderByRaw('COALESCE(p.source_created_at, p.created_at) DESC, p.id DESC');
    case 'price_asc':
      return qb.orderByRaw(`${EFFECTIVE_PRICE} ASC, ${CODE_ORDER} ASC NULLS LAST, p.id`);
    case 'price_desc':
      return qb.orderByRaw(`${EFFECTIVE_PRICE} DESC, ${CODE_ORDER} ASC NULLS LAST, p.id`);
    case 'title':
      return qb.orderByRaw('i.title ASC, p.id');
    default:
      return qb.orderByRaw(`${CODE_ORDER} ASC NULLS LAST, p.id`);
  }
}

/**
 * Paginated product listing (category, collection, search, filters, sort).
 * @returns {Promise<{ products: object[], total: number, hasMore: boolean, limit: number, offset: number }>}
 */
export async function listProducts(db, options = {}) {
  const locale = normalizeLocale(options.locale);
  const limit = clampLimit(options.limit);
  const offset = clampOffset(options.offset);
  const sort = SORTS.includes(options.sort) ? options.sort : 'default';

  const filtered = () => applyFilters(db, baseQuery(db, locale), options);
  const [{ total }] = await filtered().count({ total: '*' });
  const rows = await applySort(db, selectProduct(db, filtered()), sort).limit(limit).offset(offset);

  const count = Number(total);
  return {
    products: rows.map((r) => mapProduct(r, options)),
    total: count,
    hasMore: offset + rows.length < count,
    limit,
    offset,
  };
}

/** Every visible product of a category (or all), default order. */
export async function listAllProducts(db, { category, locale, sort, storeId } = {}) {
  const qb = applySort(db, selectProduct(db, applyFilters(db, baseQuery(db, normalizeLocale(locale)), { category })), sort);
  const rows = await qb;
  return rows.map((r) => mapProduct(r, { storeId }));
}

export async function countProducts(db, filters = {}) {
  const [{ total }] = await applyFilters(db, baseQuery(db, normalizeLocale(filters.locale)), filters).count({ total: '*' });
  return Number(total);
}

/**
 * One product by its public code (the number in current URLs), optionally
 * restricted to a category so /kabluchki/…/<earring code> stays a 404.
 */
export async function getProductByCode(db, { code, category, locale, storeId, withVariants = true } = {}) {
  const value = String(code ?? '').trim();
  if (!/^[0-9A-Za-z-]{1,40}$/.test(value)) return null;
  const qb = applyFilters(db, baseQuery(db, normalizeLocale(locale)), { category });
  const row = await selectProduct(db, qb.where('p.legacy_code', value)).first();
  if (!row) return null;
  const product = mapProduct(row, { storeId });
  if (withVariants) product.variants = await getVariants(db, row.id);
  return product;
}

/** Products by codes, returned in the order of `codes` (missing ones skipped). */
export async function getProductsByCodes(db, { codes = [], locale, storeId } = {}) {
  const list = codes.map((c) => String(c)).filter(Boolean);
  if (!list.length) return [];
  const rows = await selectProduct(db, applyFilters(db, baseQuery(db, normalizeLocale(locale)), { codes: list }));
  const byCode = new Map(rows.map((r) => [String(r.legacy_code), mapProduct(r, { storeId })]));
  return list.map((c) => byCode.get(c)).filter(Boolean);
}

export async function getVariants(db, productId) {
  const rows = await db('product_variants')
    .select('id', 'size', 'size_label', 'weight_g', 'price', 'stock_qty')
    .where('product_id', productId)
    .orderByRaw('size NULLS FIRST, id');
  return rows.map(mapVariant);
}

/**
 * Sizes offered for a product, matching the DNTrade-era behaviour: every sized
 * variant (ring piece) of the products in the same category that share the article
 * (SKU). Sold-out pieces are included by default, as on the DNTrade storefront
 * (sizes can be ordered); pass `inStockOnly` to list only pieces in stock.
 * @returns {Promise<number[]>} sorted, unique
 */
export async function getSizesByArticle(db, { article, category = 'ring', inStockOnly = false } = {}) {
  const value = String(article ?? '').trim();
  if (!value) return [];
  const rows = await db({ v: 'product_variants' })
    .distinct('v.size')
    .join({ p: 'products' }, 'p.id', 'v.product_id')
    .join({ c: 'categories' }, 'c.id', 'p.category_id')
    .where('c.code', toCategoryDbCode(category) || '__none__')
    .where('p.status', 'active')
    .whereRaw('lower(btrim(p.article)) = lower(?)', [value])
    .whereNotNull('v.size')
    .modify((qb) => { if (inStockOnly) qb.whereRaw('(v.stock_qty IS NULL OR v.stock_qty > 0)'); })
    .orderBy('v.size');
  return rows.map((r) => Number(r.size));
}

/**
 * Related products: same category, ranked by shared collections + attribute
 * values, then by closeness of the code (neighbouring models).
 */
export async function getRelatedProducts(db, { productId, locale, limit = 8, storeId } = {}) {
  const base = await db('products').select('id', 'category_id', 'legacy_code').where('id', productId).first();
  if (!base) return [];
  const qb = baseQuery(db, normalizeLocale(locale))
    .where('p.category_id', base.category_id)
    .whereNot('p.id', base.id);
  const rows = await selectProduct(db, qb)
    .select(db.raw(
      `((SELECT count(*) FROM collection_products a JOIN collection_products b
           ON b.collection_id = a.collection_id AND b.product_id = ? WHERE a.product_id = p.id)
      + (SELECT count(*) FROM product_attribute_values a JOIN product_attribute_values b
           ON b.attribute_value_id = a.attribute_value_id AND b.product_id = ? WHERE a.product_id = p.id)) AS score`,
      [base.id, base.id]
    ))
    .orderBy('score', 'desc')
    .orderByRaw(
      `abs(COALESCE(${CODE_ORDER}, 0) - ?) ASC, p.id`,
      [/^\d+$/.test(base.legacy_code || '') ? Number(base.legacy_code) : 0]
    )
    .limit(clampLimit(limit, 8));
  return rows.map((r) => mapProduct(r, { storeId }));
}

/** Filter options for a listing: attribute values with counts, price range, sizes. */
export async function getFacets(db, { category, collection, locale } = {}) {
  const loc = normalizeLocale(locale);
  const scope = () => applyFilters(db, baseQuery(db, loc), { category, collection });

  const [price] = await scope().select(
    db.raw(`min(${EFFECTIVE_PRICE}) AS min`), db.raw(`max(${EFFECTIVE_PRICE}) AS max`)
  );
  const attributeRows = await scope()
    .join({ pav: 'product_attribute_values' }, 'pav.product_id', 'p.id')
    .join({ av: 'attribute_values' }, 'av.id', 'pav.attribute_value_id')
    .join({ a: 'attributes' }, 'a.id', 'av.attribute_id')
    .join({ ai: 'attribute_i18n' }, function onAi() { this.on('ai.attribute_id', 'a.id').andOn('ai.locale', db.raw('?', [loc])); })
    .join({ avi: 'attribute_value_i18n' }, function onAvi() { this.on('avi.attribute_value_id', 'av.id').andOn('avi.locale', db.raw('?', [loc])); })
    .where('a.is_filterable', true)
    .groupBy('a.code', 'a.sort_order', 'ai.name', 'av.slug', 'av.sort_order', 'avi.value')
    .select('a.code', 'ai.name', 'av.slug', 'avi.value', db.raw('count(DISTINCT p.id)::int AS count'))
    .orderBy([{ column: 'a.sort_order' }, { column: 'av.sort_order' }, { column: 'avi.value' }]);
  const sizeRows = await scope()
    .join({ v: 'product_variants' }, 'v.product_id', 'p.id')
    .whereNotNull('v.size')
    .whereRaw('(v.stock_qty IS NULL OR v.stock_qty > 0)')
    .distinct('v.size')
    .orderBy('v.size');

  const attributes = [];
  for (const r of attributeRows) {
    let a = attributes.find((x) => x.code === r.code);
    if (!a) attributes.push((a = { code: r.code, name: r.name, values: [] }));
    a.values.push({ slug: r.slug, value: r.value, count: r.count });
  }
  return {
    price: { min: price?.min == null ? null : Number(price.min), max: price?.max == null ? null : Number(price.max) },
    attributes,
    sizes: sizeRows.map((r) => Number(r.size)),
  };
}

/** Localized category texts (name, slug, url_prefix, SEO) by storefront key. */
export async function getCategory(db, { category, locale } = {}) {
  const row = await db({ c: 'categories' })
    .join({ ci: 'category_i18n' }, function onCi() { this.on('ci.category_id', 'c.id').andOn('ci.locale', db.raw('?', [normalizeLocale(locale)])); })
    .where('c.code', toCategoryDbCode(category) || '__none__')
    .where('c.is_active', true)
    .first('c.code', 'ci.name', 'ci.slug', 'ci.url_prefix', 'ci.description', 'ci.seo_title', 'ci.seo_description', 'ci.is_fallback');
  return row || null;
}

/** Lightweight refs for sitemap / generateStaticParams. */
export async function listProductRefs(db, { category } = {}) {
  const rows = await applyFilters(db, baseQuery(db, DEFAULT_LOCALE), { category })
    .select('p.legacy_code', 'c.code as category_code', 'p.updated_at')
    .orderByRaw(`${CODE_ORDER} ASC NULLS LAST, p.id`);
  return rows.map((r) => ({
    code: String(r.legacy_code),
    category: mapProduct({ category_code: r.category_code }).category,
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
  }));
}
