import 'server-only';
import { unstable_cache } from 'next/cache';
import { getDb } from '../db';
import * as repo from './repository.js';
import { CATALOG_CACHE_TAGS, CATALOG_REVALIDATE_SECONDS } from './tags.js';

// Server-side catalog API backed by PostgreSQL, for Server Components, Route
// Handlers and API routes. Results are cached with unstable_cache (same 900 s
// window the DNTrade cache used) and tagged so they can be purged on demand:
//   POST /api/catalog/revalidate  (see src/app/api/catalog/revalidate/route.js)

export { CATALOG_CACHE_TAGS, CATALOG_REVALIDATE_SECONDS };

// DNTrade store id, still needed by the DNTrade order upload (src/lib/dntradeOrder.js)
// while orders keep going to DNTrade. Optional; not a secret.
let warnedStoreId = false;
const storeId = () => {
  const id = process.env.DNTRADE_STORE_ID || null;
  if (!id && !warnedStoreId) {
    warnedStoreId = true;
    console.warn('[catalog] DNTRADE_STORE_ID is not set: cart items have no store_id and DNTrade may reject order uploads.');
  }
  return id;
};

const cached = (name, fn) =>
  unstable_cache(fn, ['catalog', name], {
    revalidate: CATALOG_REVALIDATE_SECONDS,
    tags: CATALOG_CACHE_TAGS,
  });

export const listCatalogProducts = cached('list', (options = {}) =>
  repo.listProducts(getDb(), { ...options, storeId: storeId() })
);

export const getAllCatalogProducts = cached('all', (category, locale = 'uk') =>
  repo.listAllProducts(getDb(), { category, locale, storeId: storeId() })
);

export const getCatalogProduct = cached('by-code', (category, code, locale = 'uk') =>
  repo.getProductByCode(getDb(), { category, code, locale, storeId: storeId() })
);

export const getCatalogProductsByCodes = cached('by-codes', (codes, locale = 'uk') =>
  repo.getProductsByCodes(getDb(), { codes, locale, storeId: storeId() })
);

export const getCatalogSizes = cached('sizes', (article, category = 'ring') =>
  repo.getSizesByArticle(getDb(), { article, category })
);

export const getRelatedCatalogProducts = cached('related', (productId, locale = 'uk', limit = 8) =>
  repo.getRelatedProducts(getDb(), { productId, locale, limit, storeId: storeId() })
);

export const getCatalogProductFamily = cached('family', (productId, locale = 'uk') =>
  repo.getProductFamily(getDb(), { productId, locale, storeId: storeId() })
);

export const getCatalogFacets =cached('facets', (category, locale = 'uk', collection = null) =>
  repo.getFacets(getDb(), { category, locale, collection })
);

export const getCatalogCategory = cached('category', (category, locale = 'uk') =>
  repo.getCategory(getDb(), { category, locale })
);

export const getCatalogProductRefs = cached('refs', (category) =>
  repo.listProductRefs(getDb(), { category })
);

export const countCatalogProducts = cached('count', (category) =>
  repo.countProducts(getDb(), { category })
);

/** Search is per-query and cheap; cached briefly to absorb typing bursts. */
export const searchCatalog = unstable_cache(
  (q, { limit = 20, offset = 0, locale = 'uk' } = {}) =>
    repo.listProducts(getDb(), { q, limit, offset, locale, storeId: storeId() }),
  ['catalog', 'search'],
  { revalidate: 60, tags: CATALOG_CACHE_TAGS }
);
