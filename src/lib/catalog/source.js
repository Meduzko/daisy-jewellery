// Catalog data source switch (rollback flag).
//
//   CATALOG_SOURCE=postgres  (default) — products are read from PostgreSQL via Knex.
//   CATALOG_SOURCE=dntrade   — previous behaviour: products are read from the DNTrade API
//                              (needs API_ROOT_URI, API_KEY and the *_CATEGORY_ID variables).
//
// Server-only value; a restart/rebuild is needed after changing it.

export const CATALOG_SOURCES = ['postgres', 'dntrade'];

export function getCatalogSource(env = process.env) {
  const value = String(env.CATALOG_SOURCE || '').trim().toLowerCase();
  return value === 'dntrade' ? 'dntrade' : 'postgres';
}

export const isPostgresCatalog = (env) => getCatalogSource(env) === 'postgres';
