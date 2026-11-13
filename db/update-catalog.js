#!/usr/bin/env node
// One command to push the product CSVs (db/products_csv/) into PostgreSQL.
//
//   npm run db:update                          local Docker DB (compose.yaml, .env.local)
//   npm run db:update -- --production          production DB on the server (asks for confirmation)
//   npm run db:update -- --production --yes    … without the confirmation prompt
//   options (production): --container=<docker container>  (default: the container publishing the DATABASE_URL port)
//                         --site-url=http://127.0.0.1:3000 (catalog cache purge; default http://127.0.0.1:$PORT|3000)
//
// Steps — the run stops at the first failing step, so nothing is imported without a verified
// backup and a clean dry run:
//   local:       db:up → db:backup → migrate → patch:specs → import dry run → import → —
//   production:  —     → backup*   → migrate → patch:specs → import dry run → import → cache purge**
//   *  pg_dump inside the PostgreSQL container (the server has no pg_dump) → db/backups/, checked with pg_restore --list
//   ** POST /api/catalog/revalidate when CATALOG_REVALIDATE_SECRET is set (otherwise the site updates within 15 min)
// The import is db/import/import-product-content.js --update-prices (previous values → report + audit_logs).
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, ...v] = a.replace(/^--/, '').split('=');
  return [k, v.length ? v.join('=') : true];
}));
const PROD = Boolean(args.production);

// ---------------------------------------------------------------- environment
// Same files and order as Next.js (earlier file wins; real environment variables win over all).
const ENV_FILES = PROD ? ['.env.production.local', '.env.local', '.env.production', '.env'] : ['.env.local', '.env'];
const origin = {};
for (const file of ENV_FILES) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) continue;
  for (const line of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || m[1] in process.env) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    origin[m[1]] = file;
  }
}
if (PROD) process.env.NODE_ENV = 'production';
else if (process.env.NODE_ENV === 'production') {
  console.error('NODE_ENV=production: run `npm run db:update -- --production` for the production database.');
  process.exit(1);
}

const fail = (msg) => { console.error(`\n✘ ${msg}`); process.exit(1); };
let url;
try { url = new URL(process.env.DATABASE_URL); } catch { fail(`DATABASE_URL is missing or invalid (looked in ${ENV_FILES.join(', ')}).`); }
const DB = { host: url.hostname, port: url.port || '5432', name: decodeURIComponent(url.pathname.slice(1)), user: decodeURIComponent(url.username) };
const where = `${DB.user}@${DB.host}:${DB.port}/${DB.name} (DATABASE_URL from ${origin.DATABASE_URL || 'environment'})`;

const run = (cmd, argv, opts = {}) => spawnSync(cmd, argv, { cwd: ROOT, stdio: 'inherit', env: process.env, ...opts });
const node = (script, ...a) => () => run(process.execPath, [script, ...a]).status === 0;
const npm = (script) => () => run('npm', ['run', script], { shell: true }).status === 0;
const KNEX = path.join(path.dirname(require.resolve('knex/package.json')), 'bin/cli.js');
const knexEnv = PROD ? 'production' : 'development';

// ---------------------------------------------------------------- production backup (inside the container)
function findContainer() {
  if (args.container) return args.container;
  const r = spawnSync('docker', ['ps', '--filter', `publish=${DB.port}`, '--format', '{{.Names}}'], { encoding: 'utf8' });
  const names = (r.stdout || '').split('\n').map((s) => s.trim()).filter(Boolean);
  if (r.status !== 0) fail(`docker ps failed: ${(r.stderr || r.error?.message || '').trim()}`);
  if (names.length !== 1) fail(`expected one container publishing port ${DB.port}, found ${names.length} (${names.join(', ') || '—'}). Pass --container=<name>.`);
  return names[0];
}
function prodBackup(container) {
  return () => {
    const dir = path.join(ROOT, 'db/backups');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${DB.name}-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`);
    const fd = fs.openSync(file, 'w');
    const r = spawnSync('docker', ['exec', container, 'pg_dump', '-U', DB.user, '-Fc', DB.name], { stdio: ['ignore', fd, 'inherit'] });
    fs.closeSync(fd);
    const size = fs.statSync(file).size;
    if (r.status !== 0 || size === 0) { console.error(`pg_dump failed (exit ${r.status}, ${size} bytes)`); return false; }
    // Prove the dump is readable and contains the catalog.
    const list = spawnSync('docker', ['exec', '-i', container, 'pg_restore', '--list'], { input: fs.readFileSync(file), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (list.status !== 0 || !/TABLE DATA public products /.test(list.stdout)) { console.error('backup check failed: pg_restore --list does not show the products data'); return false; }
    console.log(`backup: ${path.relative(ROOT, file)} (${(size / 1024).toFixed(0)} KiB, ${list.stdout.split('\n').filter((l) => /TABLE DATA/.test(l)).length} tables)`);
    console.log(`restore: docker exec -i ${container} pg_restore -U ${DB.user} -d ${DB.name} --clean --if-exists < ${path.relative(ROOT, file)}`);
    return true;
  };
}

// ---------------------------------------------------------------- cache purge (production, optional)
async function purgeCache() {
  const secret = process.env.CATALOG_REVALIDATE_SECRET;
  if (!secret) { console.log('CATALOG_REVALIDATE_SECRET not set — skipped; the site shows the changes within 15 min.'); return true; }
  const site = args['site-url'] || `http://127.0.0.1:${process.env.PORT || 3000}`;
  try {
    const res = await fetch(`${site}/api/catalog/revalidate`, { method: 'POST', headers: { Authorization: `Bearer ${secret}` } });
    console.log(`POST ${site}/api/catalog/revalidate → ${res.status}`);
    if (!res.ok) console.warn('⚠ cache purge failed — the site shows the changes within 15 min.');
  } catch (e) {
    console.warn(`⚠ cache purge failed (${e.message}) — pass --site-url=…; the site shows the changes within 15 min.`);
  }
  return true; // never fails the run: the data is already imported
}

// ---------------------------------------------------------------- main
async function confirm() {
  if (!PROD || args.yes) return;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => rl.question(`\nThis changes the PRODUCTION database ${DB.name}. Type its name to continue: `, resolve));
  rl.close();
  if (answer.trim() !== DB.name) fail('not confirmed — nothing was changed.');
}

async function main() {
  const container = PROD ? findContainer() : null;
  const importArgs = [`--env=${knexEnv}`, '--update-prices', ...(PROD ? ['--allow-production'] : [])];
  const steps = [
    ...(PROD ? [] : [['Start PostgreSQL (Docker)', npm('db:up')]]),
    ['Backup', PROD ? prodBackup(container) : npm('db:backup')],
    ['Migrations', node(KNEX, 'migrate:latest', '--env', knexEnv)],
    ['Schema patch (idempotent)', node('db/patches/20261112_product_specs.js', `--env=${knexEnv}`)],
    ['Import — dry run', node('db/import/import-product-content.js', ...importArgs, '--dry-run')],
    ['Import — apply', node('db/import/import-product-content.js', ...importArgs)],
    ...(PROD ? [['Catalog cache purge', purgeCache]] : []),
  ];

  console.log(`Catalog update — ${PROD ? 'PRODUCTION' : 'local'}`);
  console.log(`  database:  ${where}`);
  if (container) console.log(`  container: ${container} (backup)`);
  console.log(`  source:    db/products_csv/ (${fs.readdirSync(path.join(ROOT, 'db/products_csv')).filter((f) => f.endsWith('.csv')).length} CSV files)`);
  await confirm();

  const started = Date.now();
  for (const [i, [title, step]] of steps.entries()) {
    console.log(`\n=== ${i + 1}/${steps.length} ${title} ===`);
    if (!(await step())) {
      const backedUp = steps.findIndex(([t]) => t === 'Backup') < i;
      fail(`Step ${i + 1} «${title}» failed. Stopped — later steps were not run.${backedUp ? ' The backup from the Backup step is in db/backups/.' : ''}`);
    }
  }
  console.log(`\n✔ Catalog updated (${PROD ? 'production' : 'local'}) in ${((Date.now() - started) / 1000).toFixed(0)} s.`);
}

main().catch((e) => fail(e.stack || e.message));
