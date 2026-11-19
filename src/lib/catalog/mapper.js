// Maps PostgreSQL catalog rows to the product shape the storefront already uses
// (historically the DNTrade API product). Keeping that contract means the UI,
// cart, pricing helpers and checkout work unchanged regardless of the source.
//
// Never put internal data here (cost_price, supplier, contacts): the result is
// rendered into pages and stored in the visitor's cart.

import { toCategoryKey } from './categories.js';
import { productImageUrl } from './images.js';

// Collections that the storefront shows as badges (DNTrade tag «бейдж» items).
const BADGE_BY_COLLECTION = {
  popular: 'популярне',
  new: 'новинка',
};

const toNumberOrString = (value) => {
  const s = String(value ?? '').trim();
  return /^\d+$/.test(s) ? Number(s) : s;
};

export function salePercent(price, salePrice) {
  const p = Number(price);
  const s = Number(salePrice);
  if (!Number.isFinite(p) || !Number.isFinite(s) || p <= 0 || s >= p) return null;
  return Math.round(((p - s) / p) * 100);
}

/** Badges in the DNTrade tag format so `getProductBadges()` keeps working. */
export function buildBadgeTags(row) {
  const items = [];
  const percent = row.sale_price != null ? salePercent(row.price, row.sale_price) : null;
  if (percent) items.push({ id: `sale-${row.id}`, title: `знижка/${percent}`, color: null, status: 1 });
  for (const code of row.collection_codes || []) {
    const title = BADGE_BY_COLLECTION[code];
    if (title) items.push({ id: `${code}-${row.id}`, title, color: null, status: 1 });
  }
  return items.length ? [{ id: 'badge', title: 'бейдж', items }] : [];
}

/** @param {object} row  product row joined with product_i18n (see repository.js) */
export function mapProduct(row) {
  if (!row) return null;
  const images = Array.isArray(row.image_keys) ? row.image_keys.map(productImageUrl).filter(Boolean) : [];
  const category = toCategoryKey(row.category_code) || '';

  return {
    id: row.id,
    product_id: `pg-${row.id}`,
    parent_id: null,
    code: toNumberOrString(row.legacy_code ?? row.id),
    sku: row.article || '',
    title: row.title || '',
    slug: row.slug || null,
    short_description: row.short_description || '',
    description: row.description || '',
    seo_title: row.seo_title || null,
    seo_description: row.seo_description || null,
    image_path: images[0] || null,
    images,
    price: row.price == null ? null : String(row.price),
    // «Середня вага» of the model (grams); piece weights stay on the variants.
    avg_weight_g: row.avg_weight_g == null ? null : Number(row.avg_weight_g),
    // [{ code, name, values: [{ slug, value }] }] — filled for the product page only.
    attributes: Array.isArray(row.attributes) ? row.attributes : [],
    spec_terms: Array.isArray(row.spec_terms) ? row.spec_terms : [],
    // [{ slug, value, color }] — «Вставка» values; drive the variant swatches.
    insertions: Array.isArray(row.insertions) ? row.insertions : [],
    // [{ slug, value }] — «Покриття» values; plating part of the variant label.
    coatings: Array.isArray(row.coatings) ? row.coatings : [],
    // [{ slug, value, color }] — «Колір вставки» values; matching set items (product page).
    insertion_colors: Array.isArray(row.insertion_colors) ? row.insertion_colors : [],
    // Explicit sale price from the DB; productPricing.applyProductDiscount() prefers it.
    catalogSalePrice: row.sale_price == null ? null : String(row.sale_price),
    category,
    // product URL prefix of the category per locale ({ uk: 'kabluchki/kupyty-sribnu-kabluchku', ru: … }), see getProductLink
    category_paths: row.category_paths || null,
    tags: buildBadgeTags(row),
    collections: row.collection_codes || [],
    locale: row.locale,
    is_fallback: Boolean(row.is_fallback),
    website_synch: 1,
    status: 1,
    source: 'postgres',
  };
}

/**
 * Rows of category_i18n joined with categories (one per locale) → one category:
 * { id, code, key, parentId, sortOrder, image, showInNavigation, showOnHomepage, updatedAt, uk: {…}, ru: {…} }.
 */
export function mapCategory(rows) {
  const [first] = rows;
  const texts = (locale) => {
    const r = rows.find((row) => row.locale === locale) || first;
    return {
      name: r.name, h1: r.h1 || r.name, slug: r.slug, urlPrefix: r.url_prefix,
      description: r.description || '', seoBottomText: r.seo_bottom_text || '',
      seoTitle: r.seo_title || '', seoDescription: r.seo_description || '',
      isFallback: Boolean(r.is_fallback),
    };
  };
  return {
    id: first.id,
    code: first.code,
    key: toCategoryKey(first.code),
    parentId: first.parent_id ?? null,
    sortOrder: first.sort_order,
    image: productImageUrl(first.image_r2_key),
    showInNavigation: Boolean(first.show_in_navigation),
    showOnHomepage: Boolean(first.show_on_homepage),
    productCount: Number(first.product_count ?? 0),
    // shows this collection's products instead of its own (product pages stay under their own category)
    collectionId: first.collection_id ?? null,
    updatedAt: first.updated_at instanceof Date ? first.updated_at.toISOString() : first.updated_at ?? null,
    uk: texts('uk'),
    ru: texts('ru'),
  };
}

/** Flat attribute rows (code, name, slug, value; already sorted) → grouped list. */
export function mapAttributes(rows = []) {
  const out = [];
  for (const r of rows) {
    let a = out.find((x) => x.code === r.code);
    if (!a) out.push((a = { code: r.code, name: r.name, values: [] }));
    a.values.push({ slug: r.slug, value: r.value });
  }
  return out;
}

/** Public variant fields only (no cost price, no legacy ids). */
export function mapVariant(v) {
  return {
    id: v.id,
    size: v.size == null ? null : Number(v.size),
    size_label: v.size_label || null,
    weight_g: v.weight_g == null ? null : Number(v.weight_g),
    price: v.price == null ? null : String(v.price),
    in_stock: v.stock_qty == null || Number(v.stock_qty) > 0,
  };
}
