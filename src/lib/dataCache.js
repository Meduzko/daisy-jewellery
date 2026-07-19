import { unstable_cache } from 'next/cache';

const REVALIDATE_SECONDS = 900;

export const getCachedAllProducts = unstable_cache(
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

export async function getCachedProducts({ categoryId, offset = 0, limit = 16 }) {
  const products = await getCachedAllProducts(categoryId);

  return {
    products: products.slice(offset, offset + limit),
    hasMore: offset + limit < products.length,
  };
}

export async function getCachedProductByCode(categoryId, code) {
  const products = await getCachedAllProducts(categoryId);
  const cached = products.find((product) => String(product.code) === String(code));
  if (cached) return cached;

  // Cache miss: the product may have been added after the cached list was
  // populated (list revalidates every 900s). Fall back to a live lookup by code
  // so freshly added products are not shown as 404 during the staleness window.
  const { fetchProduct } = await import('../actions/fetchProduct');
  const result = await fetchProduct({ categoryId, code });
  return result?.[0] || null;
}

export const getCachedTotalPages = async (categoryId, itemsPerPage = 16) => {
  const products = await getCachedAllProducts(categoryId);
  return Math.ceil(products.length / itemsPerPage);
};
