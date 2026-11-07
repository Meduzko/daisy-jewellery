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
    };
  }
  const { listCatalogProducts } = await import('./catalog');
  const { products, hasMore } = await listCatalogProducts({
    category: toCategoryKey(category),
    offset,
    limit,
    locale,
  });
  return { products, hasMore };
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

export const getCachedTotalPages = async (category, itemsPerPage = 16) => {
  if (getCatalogSource() === 'dntrade') {
    const products = await getCachedDntradeProducts(dntradeCategoryId(category));
    return Math.ceil(products.length / itemsPerPage);
  }
  const { countCatalogProducts } = await import('./catalog');
  const total = await countCatalogProducts(toCategoryKey(category));
  if (!total) {
    throw new Error(`Catalog returned no products for category ${category}`);
  }
  return Math.ceil(total / itemsPerPage);
};

/** Ring sizes for the product page / size dialog (server side). */
export async function getCachedProductSizes(category, product) {
  if (getCatalogSource() === 'dntrade') {
    const { getServerProductSizes } = await import('../actions/fetchProduct');
    return getServerProductSizes(product?.sku, dntradeCategoryId(category));
  }
  const { getCatalogSizes } = await import('./catalog');
  return getCatalogSizes(product?.sku, toCategoryKey(category));
}
