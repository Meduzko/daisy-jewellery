// Test database helpers. Uses TEST_DATABASE_URL (knexfile "test" environment) and
// rebuilds the schema from the migrations — never point it at a real database.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const knexFactory = require('knex');
const knexConfig = require(path.join(ROOT, 'knexfile.js'));

export function testDbConfig() {
  const cfg = knexConfig.test;
  const url = String(cfg.connection?.connectionString || cfg.connection || '');
  if (!url) throw new Error('TEST_DATABASE_URL is not set (see .env.example)');
  const dbName = url.split('?')[0].split('/').pop();
  if (!/test/i.test(dbName)) {
    throw new Error(`Refusing to run destructive tests against "${dbName}": the test database name must contain "test"`);
  }
  return { ...cfg, migrations: { ...cfg.migrations, directory: path.join(ROOT, 'db/migrations') } };
}

export function createTestDb() {
  return knexFactory(testDbConfig());
}

/** Drop everything and migrate from scratch. */
export async function resetSchema(db) {
  await db.raw('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await db.migrate.latest();
}
