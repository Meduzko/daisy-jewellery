import { unstable_cache } from 'next/cache';
import { getCatalogSource } from './catalog/source';
import { toCategoryKey } from './catalog/categories';

// Storefront product access used by pages. The data source is chosen by
// CATALOG_SOURCE (see ./catalog/source.js): PostgreSQL by default, DNTrade for rollback.
// `category` is a storefront key: 'ring' | 'earring' | 'necklace' | 'bracer'.

const REVALIDATE_SECONDS = 900;

// DNTrade category ids per storefront key (rollback path only).
const dntradeCategoryId = (category) => ({
  ring: process.env.RING_CATEGORY_ID,
  necklace: process.env.NECKLACE_CATEGORY_ID,
  earring: process.env.EARING_CATEGORY_ID,
  bracer: process.env.BRACER_CATEGORY_ID,
}[toCategoryKey(category)]);

// ---------------------------------------------------------------- DNTrade (rollback)
const getCachedDntradeProducts = unstable_cache(
  async (categoryId) => {
    const { fetchAllProducts } = await import('../actions/fetchAllProducts');
    const products = await fetchAllProducts({ categoryId });

    // Throw instead of returning an empty array so a failed/empty fetch is
    // never persisted by unstable_cache and never baked into a 404 page.
    // On build this fails loudly; at runtime ISR keeps serving the last good page.
    if (!products || !products.length) {
      throw new Error(`fetchAllProducts returned no products for category ${categoryId}`);
    }

    return products;
  },
  ['all-products'],
  { revalidate: REVALIDATE_SECONDS, tags: ['products'] }
);

// ---------------------------------------------------------------- public API
export async function getCachedAllProducts(category, locale = 'uk') {
  if (getCatalogSource() === 'dntrade') {
    return getCachedDntradeProducts(dntradeCategoryId(category));
  }
  const { getAllCatalogProducts } = await import('./catalog');
  const products = await getAllCatalogProducts(toCategoryKey(category), locale);
  // Same guard as the DNTrade path: never bake an empty category into ISR pages.
  if (!products.length) {
    throw new Error(`Catalog returned no products for category ${category}`);
  }
  return products;
}

export async function getCachedProducts({ category, offset = 0, limit = 16, locale = 'uk' }) {
  if (getCatalogSource() === 'dntrade') {
    const products = await getCachedDntradeProducts(dntradeCategoryId(category));
    return {
      products: products.slice(offset, offset + limit),
      hasMore: offset + limit < products.length,
      total: products.length,
    };
  }
  const { listCatalogProducts } = await import('./catalog');
  const { products, hasMore, total } = await listCatalogProducts({
    category: toCategoryKey(category),
    offset,
    limit,
    locale,
  });
  return { products, hasMore, total };
}

export async function getCachedProductByCode(category, code, locale = 'uk') {
  if (getCatalogSource() === 'dntrade') {
    const categoryId = dntradeCategoryId(category);
    const products = await getCachedDntradeProducts(categoryId);
    const cached = products.find((product) => String(product.code) === String(code));
    if (cached) return cached;

    // Cache miss: the product may have been added after the cached list was
    // populated (list revalidates every 900s). Fall back to a live lookup by code
    // so freshly added products are not shown as 404 during the staleness window.
    const { fetchProduct } = await import('../actions/fetchProduct');
    const result = await fetchProduct({ categoryId, code });
    return result?.[0] || null;
  }
  const { getCatalogProduct } = await import('./catalog');
  return getCatalogProduct(toCategoryKey(category), String(code), locale);
}

/** Ring sizes for the product page / size dialog (server side). */
export async function getCachedProductSizes(category, product) {
  if (getCatalogSource() === 'dntrade') {
    const { getServerProductSizes } = await import('../actions/fetchProduct');
    return getServerProductSizes(product?.sku, dntradeCategoryId(category));
  }
  const { getCatalogSizes } = await import('./catalog');
  return getCatalogSizes(product?.sku, toCategoryKey(category));
}

// ---------------------------------------------------------------- product page (redesign)

const ALL_CATEGORY_KEYS = ['ring', 'earring', 'necklace', 'bracer'];

/**
 * Other cards of the same model (same article base, see helpers/productFamily.js),
 * in every category: `variants` = same category (swatches), `set` = cards of
 * the other categories («Доповніть образ»; the page picks one per category).
 * @returns {Promise<{ variants: object[], set: object[] }>}
 */
export async function getCachedProductFamily(category, product, locale = 'uk') {
  const key = toCategoryKey(category);
  let family = [];
  if (getCatalogSource() === 'dntrade') {
    const { getArticleBase } = await import('../helpers/productFamily');
    const base = getArticleBase(product?.sku);
    if (!base) return { variants: [], set: [] };
    const lists = await Promise.all(
      ALL_CATEGORY_KEYS.map(async (k) => {
        try {
          const items = await getCachedDntradeProducts(dntradeCategoryId(k));
          return items.map((p) => ({ ...p, category: p.category || k }));
        } catch {
          return [];
        }
      })
    );
    family = lists.flat().filter((p) => String(p.code) !== String(product.code) && getArticleBase(p.sku) === base);
  } else {
    if (!product?.id) return { variants: [], set: [] };
    const { getCatalogProductFamily } = await import('./catalog');
    family = await getCatalogProductFamily(product.id, locale);
  }

  const variants = family.filter((p) => p.category === key);
  const set = family.filter((p) => p.category && p.category !== key);
  return { variants, set };
}

/**
 * «Вам також сподобається»: same-category products. Cards matching `stem` (the
 * product's collection, e.g. «клевер») come first, then the catalog's related
 * ranking (shared collections / attributes, neighbouring codes).
 * @param {{ category: string, product: object, locale?: string, stem?: string|null, exclude?: string[], limit?: number }} options
 */
export async function getCachedRelatedProducts({ category, product, locale = 'uk', stem = null, exclude = [], limit = 4 }) {
  const skip = new Set([String(product.code), ...exclude.map(String)]);
  const picked = [];
  const take = (list) => {
    for (const p of list) {
      if (picked.length >= limit) return;
      if (skip.has(String(p.code))) continue;
      skip.add(String(p.code));
      picked.push(p);
    }
  };

  if (stem) {
    const { products } = await getCachedListing({ category, limit: limit + skip.size + 4, locale, filters: { q: stem } });
    take(products);
  }
  if (picked.length < limit) {
    if (getCatalogSource() === 'dntrade') {
      const all = await getCachedDntradeProducts(dntradeCategoryId(category));
      const code = Number(product.code);
      const near = Number.isFinite(code)
        ? [...all].sort((a, b) => Math.abs(Number(a.code) - code) - Math.abs(Number(b.code) - code))
        : all;
      take(near);
    } else if (product?.id) {
      const { getRelatedCatalogProducts } = await import('./catalog');
      take(await getRelatedCatalogProducts(product.id, locale, limit + skip.size + 4));
    }
  }
  return picked.map((p) => ({ ...p, category: p.category || toCategoryKey(category) }));
}

// ---------------------------------------------------------------- category listing (redesign)
// Sort + filters for the category pages (src/components/Category). PostgreSQL does
// the work in SQL; the DNTrade rollback path supports sort, price, collection
// (badge) and title search in memory, and has no attribute / size facets.

const DNTRADE_BADGE = { new: 'новинка', popular: 'популярне' };

const dntradePrice = (p) => {
  const n = Number(String(p.price ?? '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

function filterDntradeProducts(products, f = {}) {
  const words = String(f.q || '').toLowerCase().split(/\s+/).filter(Boolean);
  let list = products.filter((p) => {
    const title = String(p.title || '').toLowerCase();
    if (words.some((w) => !title.includes(w))) return false;
    const price = dntradePrice(p);
    if (f.priceMin != null && (price == null || price < f.priceMin)) return false;
    if (f.priceMax != null && (price == null || price > f.priceMax)) return false;
    if (f.collection) {
      const badge = DNTRADE_BADGE[f.collection];
      const titles = (p.tags || []).flatMap((t) => t.items || []).map((i) => String(i.title || '').toLowerCase());
      if (!badge || !titles.includes(badge)) return false;
    }
    return true;
  });
  if (f.sort === 'price_asc') list = [...list].sort((a, b) => (dntradePrice(a) ?? 0) - (dntradePrice(b) ?? 0));
  if (f.sort === 'price_desc') list = [...list].sort((a, b) => (dntradePrice(b) ?? 0) - (dntradePrice(a) ?? 0));
  if (f.sort === 'newest') list = [...list].reverse();
  return list;
}

/**
 * One page of a category listing with sort and filters.
 * @param {{ category: string, offset?: number, limit?: number, locale?: string,
 *   filters?: { sort?, q?, collection?, attributes?, sizes?, priceMin?, priceMax? } }} options
 * @returns {Promise<{ products: object[], total: number, hasMore: boolean }>}
 */
export async function getCachedListing({ category, offset = 0, limit = 16, locale = 'uk', filters = {} }) {
  if (getCatalogSource() === 'dntrade') {
    const all = await getCachedDntradeProducts(dntradeCategoryId(category));
    const list = filterDntradeProducts(all, filters);
    return { products: list.slice(offset, offset + limit), total: list.length, hasMore: offset + limit < list.length };
  }
  const { listCatalogProducts } = await import('./catalog');
  const { products, total, hasMore } = await listCatalogProducts({
    ...filters,
    category: toCategoryKey(category),
    offset,
    limit,
    locale,
  });
  return { products, total, hasMore };
}

/** Filter options of a category: { price: {min,max}, attributes: [{code,name,values}], sizes: number[] }. */
export async function getCachedFacets(category, locale = 'uk') {
  if (getCatalogSource() === 'dntrade') {
    const all = await getCachedDntradeProducts(dntradeCategoryId(category));
    const prices = all.map(dntradePrice).filter((n) => n != null);
    return {
      price: { min: prices.length ? Math.min(...prices) : null, max: prices.length ? Math.max(...prices) : null },
      attributes: [],
      sizes: [],
    };
  }
  const { getCatalogFacets } = await import('./catalog');
  return getCatalogFacets(toCategoryKey(category), locale);
}

/**
 * Curated quick links of a category page: for each title-search stem, the number of
 * matching products and the image of the first one (links without matches are dropped).
 * @param {string} category
 * @param {string[]} stems
 */
export async function getCachedQuickLinkPreviews(category, stems, locale = 'uk') {
  const results = await Promise.all(
    stems.map(async (q) => {
      try {
        const { products, total } = await getCachedListing({ category, limit: 1, locale, filters: { q } });
        const product = products[0];
        return { q, total, image: product?.images?.[0] || product?.image_path || null };
      } catch {
        return { q, total: 0, image: null };
      }
    })
  );
  return results.filter((r) => r.total > 0);
}

/**
 * Search results (title / article / code, every word must match) with the category
 * listing's sort and filters, optionally narrowed to one category. Used by the
 * search page (/{lang}/search?q=…) and GET /api/catalog/products?search=….
 * @returns {Promise<{ products: object[], total: number, hasMore: boolean }>}
 */
export async function getCachedSearchListing({ search, category, offset = 0, limit = 16, locale = 'uk', filters = {} }) {
  const query = String(search || '').trim().slice(0, 100);
  if (query.length < 2) return { products: [], total: 0, hasMore: false };

  if (getCatalogSource() === 'dntrade') {
    const { searchProductsByTitle } = await import('./searchProducts');
    const { products } = await searchProductsByTitle({ title: query, limit: 100, locale });
    const key = toCategoryKey(category);
    const list = filterDntradeProducts(key ? products.filter((p) => p.category === key) : products, { ...filters, collection: undefined });
    return { products: list.slice(offset, offset + limit), total: list.length, hasMore: offset + limit < list.length };
  }
  const { listCatalogProducts } = await import('./catalog');
  const { products, total, hasMore } = await listCatalogProducts({
    ...filters,
    q: [query, filters.q].filter(Boolean).join(' '),
    category: toCategoryKey(category) || undefined,
    offset,
    limit,
    locale,
  });
  return { products, total, hasMore };
}
