#!/usr/bin/env node
// One-off patch for databases migrated BEFORE 2026-11-12, when migrations 2 and 3
// were edited in place (products.avg_weight_g + attribute definitions seeded in
// migration 2). Brings an existing database to the same schema without losing data.
// A database created from the current migrations already has all of this — the
// patch then changes nothing.
//
//   npm run db:patch:specs                 # development (DATABASE_URL)
//   npm run db:patch:specs -- --env=test
//   npm run db:patch:specs -- --dry-run
//
// Idempotent: ADD COLUMN IF NOT EXISTS, constraint only if missing, attribute rows
// only if missing (existing names/sort orders are kept).

const path = require('path');
const knexFactory = require('knex');
const { ATTRIBUTES } = require('../reference/attributes');

const ROOT = path.resolve(__dirname, '../..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));
const ENV = args.env || 'development';
const DRY_RUN = Boolean(args['dry-run']);

async function main() {
  const db = knexFactory(require(path.join(ROOT, 'knexfile.js'))[ENV]);
  const done = [];
  try {
    await db.transaction(async (trx) => {
      const hasColumn = await trx.schema.hasColumn('products', 'avg_weight_g');
      if (!hasColumn) {
        await trx.raw('ALTER TABLE products ADD COLUMN avg_weight_g numeric(8,3)');
        done.push('products.avg_weight_g added');
      }
      const check = await trx.raw("SELECT 1 FROM pg_constraint WHERE conname = 'products_avg_weight_check'");
      if (!check.rows.length) {
        await trx.raw('ALTER TABLE products ADD CONSTRAINT products_avg_weight_check CHECK (avg_weight_g IS NULL OR avg_weight_g > 0)');
        done.push('products_avg_weight_check added');
      }
      for (const a of ATTRIBUTES) {
        let row = await trx('attributes').where({ code: a.code }).first();
        if (!row) {
          [row] = await trx('attributes').insert({ code: a.code, sort_order: a.sort }).returning('*');
          done.push(`attribute ${a.code} added`);
        }
        for (const locale of ['uk', 'ru']) {
          const ins = await trx('attribute_translations')
            .insert({ attribute_id: row.id, locale, name: a[locale] })
            .onConflict(['attribute_id', 'locale']).ignore().returning('attribute_id');
          if (ins.length) done.push(`attribute ${a.code} name (${locale}) added`);
        }
      }
      await trx('audit_logs').insert({
        action: DRY_RUN ? 'patch.product_specs.dry_run' : 'patch.product_specs',
        entity_type: 'schema',
        after: JSON.stringify({ changes: done }),
      });
      if (DRY_RUN) throw Object.assign(new Error('dry run'), { dryRun: true });
    });
  } catch (e) {
    if (!e.dryRun) throw e;
  } finally {
    await db.destroy();
  }
  console.log(`${DRY_RUN ? '[DRY RUN — rolled back] ' : ''}Patch 2026-11-12 product specs (${ENV})`);
  console.log(done.length ? done.map((d) => `  • ${d}`).join('\n') : '  nothing to do — schema is up to date');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
