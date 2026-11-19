import 'server-only';
import { unstable_cache } from 'next/cache';
import { getDb } from '../db';
import * as repo from './repository.js';
import { CATALOG_CACHE_TAGS, CATALOG_REVALIDATE_SECONDS } from './tags.js';

// Server-side catalog API backed by PostgreSQL, for Server Components, Route
// Handlers and API routes. Results are cached with unstable_cache (900 s)
// and tagged so they can be purged on demand:
//   POST /api/catalog/revalidate  (see src/app/api/catalog/revalidate/route.js)

export { CATALOG_CACHE_TAGS, CATALOG_REVALIDATE_SECONDS };

const cached = (name, fn) =>
  unstable_cache(fn, ['catalog', name], {
    revalidate: CATALOG_REVALIDATE_SECONDS,
    tags: CATALOG_CACHE_TAGS,
  });

export const listCatalogProducts = cached('list', (options = {}) =>
  repo.listProducts(getDb(), options)
);

export const getAllCatalogProducts = cached('all', (category, locale = 'uk') =>
  repo.listAllProducts(getDb(), { category, locale })
);

export const getCatalogProduct = cached('by-code', (category, code, locale = 'uk') =>
  repo.getProductByCode(getDb(), { category, code, locale })
);

export const getCatalogProductsByCodes = cached('by-codes', (codes, locale = 'uk') =>
  repo.getProductsByCodes(getDb(), { codes, locale })
);

export const getCatalogSizes = cached('sizes', (article, category = 'ring') =>
  repo.getSizesByArticle(getDb(), { article, category })
);

export const getRelatedCatalogProducts = cached('related', (productId, locale = 'uk', limit = 8) =>
  repo.getRelatedProducts(getDb(), { productId, locale, limit })
);

export const getCatalogProductFamily = cached('family', (productId, locale = 'uk') =>
  repo.getProductFamily(getDb(), { productId, locale })
);

export const getCatalogFacets =cached('facets', (category, locale = 'uk', collection = null) =>
  repo.getFacets(getDb(), { category, locale, collection })
);

/** Published categories (navigation, routes, sitemap). Purged with the catalog tags. */
export const getCatalogCategories = cached('categories', () => repo.listCategories(getDb()));

export const getCatalogProductRefs = cached('refs', (category) =>
  repo.listProductRefs(getDb(), { category })
);

export const countCatalogProducts = cached('count', (category) =>
  repo.countProducts(getDb(), { category })
);

/** Search is per-query and cheap; cached briefly to absorb typing bursts. */
export const searchCatalog = unstable_cache(
  (q, { limit = 20, offset = 0, locale = 'uk' } = {}) =>
    repo.listProducts(getDb(), { q, limit, offset, locale }),
  ['catalog', 'search'],
  { revalidate: 60, tags: CATALOG_CACHE_TAGS }
);
