import 'server-only';
import knex from 'knex';
import knexConfig from '../../knexfile';

/**
 * Shared Knex instance for server-side code (Route Handlers, Server Actions,
 * Server Components). Created lazily so builds don't need a database, and
 * cached on globalThis so dev hot-reload doesn't open a new pool each time.
 *
 *   import { getDb } from '@/lib/db';
 *   const products = await getDb()('products').where({ status: 'active' });
 */
// `next build` prerenders pages in parallel workers (one process per CPU), and each
// process has its own pool. With the default pool (10) that is more connections than
// PostgreSQL allows (max_connections = 100), so build workers use a small pool.
const isBuild =
  process.env.NEXT_PHASE === 'phase-production-build' || process.env.IS_NEXT_WORKER === 'true';
const BUILD_POOL_MAX = Number(process.env.DATABASE_BUILD_POOL_MAX) || 2;

export function getDb() {
  if (!globalThis.__daisyDb) {
    const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    const config = knexConfig[env];
    globalThis.__daisyDb = knex(
      isBuild
        ? { ...config, pool: { ...config.pool, min: 0, max: BUILD_POOL_MAX, idleTimeoutMillis: 5000 } }
        : config
    );
  }
  return globalThis.__daisyDb;
}

/** Run `fn(trx)` in a transaction; commits on success, rolls back on throw. */
export function withTransaction(fn) {
  return getDb().transaction(fn);
}
