// Maps PostgreSQL catalog rows to the product shape the storefront already uses
// (historically the DNTrade API product). Keeping that contract means the UI,
// cart, pricing helpers and checkout work unchanged regardless of the source.
//
// Never put internal data here (cost_price, supplier, contacts): the result is
// rendered into pages and stored in the visitor's cart.

import { CATEGORY_KEY_BY_DB_CODE } from './categories.js';

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

/**
 * @param {object} row  product row joined with product_i18n (see repository.js)
 * @param {{ storeId?: string|null }} [options]
 */
export function mapProduct(row, { storeId = null } = {}) {
  if (!row) return null;
  const images = Array.isArray(row.images) ? row.images.filter(Boolean) : [];
  const category = CATEGORY_KEY_BY_DB_CODE[row.category_code] || '';

  return {
    id: row.id,
    // DNTrade GUID when known: orders are still uploaded to DNTrade by product_id.
    product_id: row.legacy_id || `pg-${row.id}`,
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
    // Explicit sale price from the DB; productPricing.applyProductDiscount() prefers it.
    catalogSalePrice: row.sale_price == null ? null : String(row.sale_price),
    store_id: storeId || null,
    category,
    tags: buildBadgeTags(row),
    collections: row.collection_codes || [],
    locale: row.locale,
    is_fallback: Boolean(row.is_fallback),
    website_synch: 1,
    status: 1,
    source: 'postgres',
  };
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
