#!/usr/bin/env node
// Copy the Russian product texts the storefront keeps in src/dictionaries/ru.json
// (products.<koltsa|sergi|kolye|braslety>.<code>.{title, description}) into
// product_translations (locale 'ru'), so the PostgreSQL catalog serves them directly.
// Products without a Russian row keep falling back to Ukrainian (product_i18n view).
//
//   npm run db:import:ru                 # import
//   npm run db:import:ru -- --dry-run    # roll back at the end
//   npm run db:import:ru -- --env=test
//
// Inserts missing ru rows, fills only NULL fields of existing ones, never overwrites;
// the dictionary `description` (plain text) goes to short_description, which is what
// the storefront shows. Refuses production; audit_logs entry per run.

const fs = require('fs');
const path = require('path');
const knexFactory = require('knex');

const ROOT = path.resolve(__dirname, '../..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  })
);
const ENV = args.env || 'development';
const DRY_RUN = Boolean(args['dry-run']);
const FILE = path.resolve(ROOT, args.file || 'src/dictionaries/ru.json');
const knexConfig = require(path.join(ROOT, 'knexfile.js'))[ENV];

// dictionary section → categories.code
const SECTIONS = { koltsa: 'rings', sergi: 'earrings', kolye: 'necklaces', braslety: 'bracelets' };

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k',
  л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', і: 'i', ї: 'i', є: 'ye', ґ: 'g',
};
const slugify = (s) =>
  [...String(s).toLowerCase()].map((c) => TRANSLIT[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const clean = (v) => (v == null ? null : String(v).trim() || null);

async function main() {
  if (process.env.NODE_ENV === 'production' || ENV === 'production') {
    throw new Error('Refusing to run against production. This importer is for local/staging databases.');
  }
  const dict = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const report = {
    started_at: new Date().toISOString(), env: ENV, dry_run: DRY_RUN, source: path.relative(ROOT, FILE),
    totals: { total: 0, inserted: 0, updated: 0, unchanged: 0, skipped: 0, failed: 0 },
    not_in_db: [], wrong_category: [], conflicts: [], failed: [],
  };

  const db = knexFactory(knexConfig);
  try {
    await db.transaction(async (trx) => {
      for (const [section, categoryCode] of Object.entries(SECTIONS)) {
        for (const [code, entry] of Object.entries(dict?.products?.[section] || {})) {
          report.totals.total++;
          const title = clean(entry?.title);
          const description = clean(entry?.description);
          const product = await trx({ p: 'products' })
            .join({ c: 'categories' }, 'c.id', 'p.category_id')
            .where('p.legacy_code', String(code))
            .first('p.id', 'c.code as category_code');
          if (!product || !title) {
            report.totals.skipped++;
            report.not_in_db.push({ section, code, reason: product ? 'no title' : 'product not in DB' });
            continue;
          }
          if (product.category_code !== categoryCode) {
            report.wrong_category.push({ section, code, db_category: product.category_code });
          }
          try {
            const status = await trx.transaction(async (sp) => {
              const existing = await sp('product_translations').where({ product_id: product.id, locale: 'ru' }).first();
              if (!existing) {
                await sp('product_translations').insert({
                  product_id: product.id, locale: 'ru', title, slug: `${slugify(title)}-${code}`, short_description: description,
                });
                return 'inserted';
              }
              const patch = {};
              if (existing.short_description == null && description) patch.short_description = description;
              if (existing.title !== title) report.conflicts.push({ code, field: 'title', db: existing.title, source: title });
              if (!Object.keys(patch).length) return 'unchanged';
              await sp('product_translations').where({ product_id: product.id, locale: 'ru' }).update({ ...patch, updated_at: sp.fn.now() });
              return 'updated';
            });
            report.totals[status]++;
          } catch (e) {
            report.totals.failed++;
            report.failed.push({ section, code, error: e.message });
          }
        }
      }
      await trx('audit_logs').insert({
        action: DRY_RUN ? 'import.ru_translations.dry_run' : 'import.ru_translations',
        entity_type: 'import',
        after: JSON.stringify({ totals: report.totals, source: report.source }),
      });
      if (DRY_RUN) throw Object.assign(new Error('dry run'), { dryRun: true });
    });
  } catch (e) {
    if (!e.dryRun) throw e;
  } finally {
    await db.destroy();
  }

  report.finished_at = new Date().toISOString();
  const dir = path.join(__dirname, 'reports');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `ru-translations-${report.started_at.replace(/[:.]/g, '-')}${DRY_RUN ? '-dry-run' : ''}.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  console.log(`${DRY_RUN ? '[DRY RUN — rolled back] ' : ''}ru translations import (${ENV})`);
  console.log(report.totals, `| not in DB: ${report.not_in_db.length} | wrong category: ${report.wrong_category.length} | conflicts: ${report.conflicts.length}`);
  console.log(`report: ${path.relative(ROOT, file)}`);
  if (report.totals.failed) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
