#!/usr/bin/env node
// One command to push the product CSVs (db/products_csv/) into the local database:
//
//   npm run db:update
//
// Steps, in order — the run stops at the first step that fails, so nothing is imported
// without a backup and without a clean dry run:
//   1. db:up             start PostgreSQL (Docker) and wait until healthy
//   2. db:backup         pg_dump → db/backups/<db>-<timestamp>.dump
//   3. db:migrate        apply pending migrations
//   4. content import    --update-prices --dry-run  (must finish with failed 0 and full validation)
//   5. content import    --update-prices            (applies; previous values → report + audit_logs)
//
// Restore the backup if needed (see db/README.md). Refuses NODE_ENV=production (the importer does too).
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
if (process.env.NODE_ENV === 'production') {
  console.error('db:update is for the local database only (NODE_ENV=production).');
  process.exit(1);
}

const STEPS = [
  ['Start PostgreSQL', 'npm', ['run', 'db:up']],
  ['Backup', 'npm', ['run', 'db:backup']],
  ['Migrations', 'npm', ['run', 'db:migrate']],
  ['Import — dry run', process.execPath, ['db/import/import-product-content.js', '--update-prices', '--dry-run']],
  ['Import — apply', process.execPath, ['db/import/import-product-content.js', '--update-prices']],
];

const started = Date.now();
for (const [i, [title, cmd, args]] of STEPS.entries()) {
  console.log(`\n=== ${i + 1}/${STEPS.length} ${title} ===`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: cmd === 'npm' });
  if (r.status !== 0) {
    console.error(`\n✘ Step ${i + 1} «${title}» failed (exit ${r.status ?? r.error?.message}). Stopped — later steps were not run.`);
    if (i >= 2) console.error('  The database was backed up in step 2 (db/backups/).');
    process.exit(1);
  }
}
console.log(`\n✔ Catalog updated in ${((Date.now() - started) / 1000).toFixed(0)} s.`);
console.log('  The site shows the changes within 15 min, or at once after POST /api/catalog/revalidate (see db/README.md).');
