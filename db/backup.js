#!/usr/bin/env node
// Backup of the local Docker PostgreSQL (compose.yaml) before data changes.
//
//   npm run db:backup            → db/backups/<POSTGRES_DB>-<timestamp>.dump  (pg_dump -Fc)
//
// Restore (into the same or an empty database):
//   docker compose --env-file .env.local exec -T postgres pg_restore -U <user> -d <db> --clean --if-exists < db/backups/<file>.dump
//
// Runs pg_dump inside the container (no local PostgreSQL tools needed). Fails if the dump is empty.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
for (const file of ['.env.local', '.env']) {
  try { process.loadEnvFile(path.join(ROOT, file)); } catch { /* missing */ }
}
const user = process.env.POSTGRES_USER;
const db = process.env.POSTGRES_DB || 'daisy_dev';
if (!user) { console.error('POSTGRES_USER is not set (.env.local)'); process.exit(1); }

const dir = path.join(ROOT, 'db/backups');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${db}-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`);
const out = fs.createWriteStream(file);
const child = spawn('docker', ['compose', '--env-file', '.env.local', 'exec', '-T', 'postgres', 'pg_dump', '-U', user, '-Fc', db],
  { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
child.stdout.pipe(out);
child.on('error', (e) => { console.error(`docker: ${e.message}`); process.exit(1); });
child.on('close', (code) => out.close(() => {
  const size = fs.statSync(file).size;
  if (code !== 0 || size === 0) { console.error(`pg_dump failed (exit ${code}, ${size} bytes) — ${path.relative(ROOT, file)} is not a valid backup`); process.exit(1); }
  console.log(`backup: ${path.relative(ROOT, file)} (${(size / 1024).toFixed(0)} KiB)`);
}));
