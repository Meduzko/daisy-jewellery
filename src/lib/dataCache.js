import { cache } from 'react';

const buildCache = new Map();

function getCacheKey(prefix, params) {
  return `${prefix}:${JSON.stringify(params)}`;
}

async function fetchWithBuildCache(cacheKey, fetchFn) {
  if (buildCache.has(cacheKey)) {
    return buildCache.get(cacheKey);
  }

  const result = await fetchFn();
  buildCache.set(cacheKey, result);
  return result;
}

export const getCachedAllProducts = cache(async (categoryId) => {
  const cacheKey = getCacheKey('allProducts', { categoryId });
  
  return fetchWithBuildCache(cacheKey, async () => {
    const { fetchAllProducts } = await import('../actions/fetchAllProducts');
    return fetchAllProducts({ categoryId });
  });
});

export const getCachedProducts = cache(async ({ categoryId, offset, limit }) => {
  const cacheKey = getCacheKey('products', { categoryId, offset, limit });
  
  return fetchWithBuildCache(cacheKey, async () => {
    const { fetchProduct } = await import('../actions/fetchProduct');
    return fetchProduct({ categoryId, offset, limit, paginated: true });
  });
});

export const getCachedTotalPages = cache(async (categoryId, itemsPerPage = 16) => {
  const products = await getCachedAllProducts(categoryId);
  if (!products || !products.length) return 1;
  return Math.ceil(products.length / itemsPerPage);
});

export function clearBuildCache() {
  buildCache.clear();
}
