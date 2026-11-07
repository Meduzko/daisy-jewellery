// Knex configuration (used by the Knex CLI and by src/lib/db.js).
// Connection settings come from environment variables only — see .env.example.

// Next.js loads .env.local itself; the Knex CLI does not, so load it here
// (existing variables are never overwritten; .env.local wins over .env).
if (!process.env.DATABASE_URL && typeof process.loadEnvFile === 'function') {
  for (const file of ['.env.local', '.env']) {
    try {
      process.loadEnvFile(file);
    } catch {
      // file missing — ignore
    }
  }
}

const shared = {
  client: 'pg',
  pool: { min: 0, max: Number(process.env.DATABASE_POOL_MAX) || 10 },
  migrations: {
    directory: './db/migrations',
    tableName: 'knex_migrations',
    loadExtensions: ['.js'],
  },
};

function connection(url) {
  if (!url) return undefined; // Knex reports a clear error on first query
  return process.env.DATABASE_SSL === 'true' ? { connectionString: url, ssl: true } : url;
}

module.exports = {
  development: { ...shared, connection: connection(process.env.DATABASE_URL) },
  test: { ...shared, connection: connection(process.env.TEST_DATABASE_URL) },
  production: { ...shared, connection: connection(process.env.DATABASE_URL) },
};
