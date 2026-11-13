# Database (PostgreSQL + Knex)

Implements the approved schema — `docs/database/architecture.md` (v3: 22 tables + 5 `*_i18n` views).
Knex is used only as a migration runner and query builder; relationships are plain PostgreSQL FKs and constraints.

```
knexfile.js              environments: development / test / production (env vars only)
db/migrations/           5 migrations, in the order of architecture §8
db/translation-table.js  shared shape of the *_translations tables (used by migrations)
src/lib/db.js            getDb() / withTransaction() for server-side Next.js code
```

## Setup (local) — PostgreSQL 18 in Docker

Requires Docker Desktop and Node 20.12+. `compose.yaml` runs `postgres:18`:

- published on **127.0.0.1:5433** only (not reachable from the network; a native PostgreSQL on 5432 is untouched),
- data in the named volume **`daisy-jewellery-pgdata`** (kept across restarts, `db:down` and image updates),
- credentials from `.env.local` (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`),
- health check `pg_isready`; `db:up` waits until the container is healthy,
- first start with an empty volume also creates `daisy_test` (`db/docker/init/`).

```bash
npm install
# .env.local: copy the PostgreSQL block from .env.example and set a password
#   (POSTGRES_PASSWORD must match the password in DATABASE_URL / TEST_DATABASE_URL)
npm run db:up          # start + wait for healthy
npm run db:migrate     # apply all pending migrations
npm run db:status      # list applied / pending migrations
npm run db:rollback    # undo the last batch
npm run db:make -- add_something   # new migration file
npm run db:down        # stop; data stays in the volume
```

Test database: `npm run db:migrate -- --env test` (uses `TEST_DATABASE_URL`).
Shell into the database: `docker compose --env-file .env.local exec postgres psql -U daisy -d daisy_dev`.

Notes
- `POSTGRES_*` and `db/docker/init/` are applied only when the volume is first created. Changing the password later: `ALTER ROLE daisy PASSWORD '…'` inside psql, then update `.env.local`.
- Never run `docker compose down -v` or `docker volume rm daisy-jewellery-pgdata` unless you intend to delete the local database.
- Copy data from a native PostgreSQL (port 5432) into Docker — non-destructive, into a database with no migrations applied yet:
  `pg_dump -h localhost -p 5432 -U daisy -Fc -f daisy_dev.dump daisy_dev`, then
  `pg_restore -h 127.0.0.1 -p 5433 -U daisy -d daisy_dev --no-owner daisy_dev.dump`.

The Knex CLI loads `.env.local` itself; Next.js loads it as usual.
Never point `DATABASE_URL` in `.env.local` at production. Production migrations are run deliberately on the server with `NODE_ENV=production npm run db:migrate`.

## Usage in Next.js (server only)

```js
import { getDb, withTransaction } from '@/lib/db';

// Localized read with fallback to Ukrainian:
const rings = await getDb()('products as p')
  .join('product_i18n as t', 't.product_id', 'p.id')
  .where({ 'p.category_id': 1, 'p.status': 'active', 't.locale': locale })
  .select('p.id', 'p.price', 't.title', 't.slug', 't.is_fallback');

await withTransaction(async (trx) => {
  const reserved = await trx('product_variants')
    .where('id', variantId).andWhere('stock_qty', '>=', qty)
    .decrement('stock_qty', qty);
  if (!reserved) throw new Error('OUT_OF_STOCK');
});
```

`src/lib/db.js` imports `server-only`, so it can't be pulled into client components.

## Types and conventions

- Money: `numeric(10,2)` (UAH). Weight: `numeric(8,3)` grams. Size: `numeric(6,2)`. `pg` returns `numeric` as strings — convert deliberately, don't do float arithmetic on prices.
- Timestamps: `timestamptz`. `created_at` defaults to `now()`; set `updated_at` in the app on update.
- Statuses are `text` + `CHECK`, no lookup tables.
- Translations live in `category_/product_/collection_/attribute_/attribute_value_translations` (PK entity + locale, FK `locales`). Write to these tables; read through the `*_i18n` views, which fall back field-by-field to the default locale (`uk`). Every entity needs a `uk` row before it goes active. New language = `INSERT INTO locales`.
- Products with orders are archived, never deleted (`order_items.variant_id` is `ON DELETE RESTRICT`).
- `payments`: unique `liqpay_order_id`, at most one `success` row per order (partial unique index). `payment_events.idempotency_key` is unique → insert callbacks with `ON CONFLICT DO NOTHING`.
- `audit_logs` is append-only: in production give the app role no `UPDATE`/`DELETE` on it:
  `REVOKE UPDATE, DELETE ON audit_logs FROM <app_role>;`

## Product import (DNTrade CSV → PostgreSQL)

```bash
npm run db:up && npm run db:migrate
npm run db:import:products -- --dry-run   # everything in a transaction, then rolled back
npm run db:import:products                # import + validate; report in db/import/reports/
```

Options: `--dir=<folder>` (default `db/products_csv/`), `--env=test`. Refuses `NODE_ENV=production`.

- Source: one CSV per category (`Товари-<каблучки|сережки|кольє|браслети>-…csv`, `;`-separated): required `Код`, `Назва`, `Зображ.`, `Артикул`, `Веб`, `Створення`; optional `Роздрібна`, `#вставка`, `#виробник`, `#постачальник`, `#довжина`, `#розмір`, `#бейдж`, `Примітка`.
- Mapping: `Код` → `products.legacy_code` (match key); `Назва` → `product_translations` (uk) title, slug = transliterated title + `-<code>`; `Артикул` → `article` (trimmed); `Зображ.` → `product_images`; `Створення` (Kyiv time) → `source_created_at`; `Веб = Так` → status `active` on first insert; `Роздрібна` → `price`; `#бейдж` `знижка/N` → `sale_price` = price − N %, `новинка` / `популярне` → collections `new` / `popular`; `#вставка` / `#виробник` → attribute values `insertion` / `manufacturer` (uk text as in source); `#постачальник` → `suppliers` (exact name match, case-insensitive — similar spellings are not merged); `#довжина` (else `#розмір`) → the default variant's `size_label`, plus numeric `size` when it is a single number (`16см`, `16,5см`). One default variant per product.
- Reference data created if missing: locales `uk`/`ru`, 4 categories (+ uk/ru names and current URL prefixes), filter attributes (insertion, metal, coating, color, manufacturer).
- Not in the CSV, left empty: DNTrade GUID, Russian texts (storefront falls back to Ukrainian via `product_i18n`), weight/stock/cost price, metal/coating/color values.
- Idempotent: one transaction, a savepoint per row. Existing rows are never deleted and non-empty values are never overwritten — only empty fields are filled; differing values are listed as `conflicts` in the report. Images/variants are added only to products that have none.
- Invalid rows (no/invalid code, no title, bad date, duplicate code, unknown category file) are skipped and listed in the report.

## Completing the catalog from the DNTrade API

Run after the CSV import. Fills what the CSV export lacks; same never-overwrite policy.

```bash
npm run db:import:dntrade -- --dry-run          # live DNTrade API (API_ROOT_URI, API_KEY, *_CATEGORY_ID)
npm run db:import:dntrade                       # report in db/import/reports/dntrade-api-*.json
npm run db:import:dntrade -- --file=dump.json   # or a saved snapshot: {"products":[…]} of API product objects
```

- Cards (`website_synch = 1`), matched by `code` → `products.legacy_code` (never created here): `legacy_id` (DNTrade GUID — orders are still uploaded to DNTrade by it), `price` if empty, uk `short_description` / `description` if empty, missing image URLs appended after the existing ones.
- Ring pieces (`website_synch = 0`, ring category) → `product_variants` of the ring card with the same article (trimmed, case-insensitive; lowest code wins when several cards share it — listed as `ambiguous`): `size_label`/`size` from «розмір», `weight_g` from the title (`…2,40г`), `stock_qty` = balance (negative → 0, listed), `legacy_id`/`legacy_code`, barcode. A piece with several sizes gets one variant per size (`<GUID>#<size>`). Pieces whose article matches no ring are listed as `orphans`.
- Never imported: purchase prices, suppliers, store ids.

## Russian product texts

```bash
npm run db:import:ru [-- --dry-run]
```

Copies `src/dictionaries/ru.json` → `products.<koltsa|sergi|kolye|braslety>.<code>` into `product_translations` (`ru`): title, slug (`<translit>-<code>`), description → `short_description`. Inserts missing rows, fills empty fields only. Products without a Russian row fall back to Ukrainian.

## Product source files (`db/products_csv/`, merged 2026-11-12)

The four DNTrade exports `Товари-<категорія>-…-веб-так.csv` (`;`, UTF-8 BOM) are the single source of
product data. The owner's content sheets were merged into them on 2026-11-12 and 2026-11-13 (pre-merge exports in git history). One header for all four:

`Код;Назва;Опис;Зображ.;Артикул;#вставка;Колір вставки;Матеріал;Покриття;Середня вага;#довжина;#розмір;Тип застібки;#постачальник;#виробник;#бейдж;Веб;Примітка;Створення;Ціна;Роздрібна`

`Ціна` = the site price (→ `products.price`), a separate field from the retail `Роздрібна` (not stored in the DB;
used for the price only when `Ціна` is empty). `Ціна` is taken strictly from the owner's sheets
(column «Ціна»): 233 products. Empty for 8061 (empty in the sheet, Роздрібна empty too →
no price, the product is hidden on the site) and for 7112 / 4830 (not in the sheets → Роздрібна 1450,00 / 2200,00 is used).
Checked 2026-11-12 against the live site: all sheet prices match. The site's discounts are in `#бейдж` as `знижка/10`
(7723, 3322, 8536, 4795, 11560, 4693, 4699).

```bash
# new database
npm run db:migrate && npm run db:import:products && npm run db:import:dntrade && npm run db:import:ru
# existing database (migrated before 2026-11-12)
npm run db:patch:specs                    # adds products.avg_weight_g + attribute definitions (idempotent)
npm run db:import:content -- --dry-run    # preview, rolled back
npm run db:import:content                 # apply; report → db/import/reports/content-*.json
```

- `db:import:products` — fill-only (never overwrites): creates cards and fills empty fields, including description,
  avg weight and the spec attributes (added only to products with no value of that attribute).
- `db:import:content` — authoritative for the content columns, for updating an existing DB: overwrites uk title,
  description (clears the old DNTrade short_description), avg_weight_g, the only variant's size label and the
  attributes insertion / insertion_color / metal / coating / clasp (links of that attribute replaced). Empty cell =
  keep. Price only fills an empty price; article is never changed. Previous values → report + `audit_logs.before`.
- Both normalise values the same way (`db/import/lib/catalog-values.js`: spellings such as «Куб.цикроній»,
  «перламутрм», «Англійська защібка» → one value with uk + ru text, multi-values split on `,`/`;`), so running
  them in any order gives the same data. ru product texts are not touched.

Migrations 2 and 3 were edited in place on 2026-11-12 (attribute definitions from `db/reference/attributes.js`,
`products.avg_weight_g numeric(8,3)`); an existing DB gets the same via `db:patch:specs`.

## Sheet update 2026-11-13

The owner's updated sheets were merged into the four exports; `db/products_csv/` now holds only these 4 merged files
(the sheets, merge logs and the 2026-11-12 versions were removed on 2026-11-13; earlier versions are in git history).
To merge a future sheet export, put the sheets in a folder and run:

```bash
npm run db:merge:sheets -- --sheets=<folder with the sheets> [--out=<output folder>]   # review, then copy the 4 CSVs over db/products_csv/
```

Merge rules (`db/import/merge-source-sheets.js`): match by `Код` (Артикул is shared, never a key); empty / `Same` / `-`
keeps the old value; formatting-only differences keep the old formatting; `Артикул` and `#довжина` are never changed
(lengths stay single numbers so the numeric size filter keeps working — owner decision 2026-11-13); `Same` in a
description = the description of the sheet row with the same Артикул (16995 ← 7943); invalid prices/weights are logged,
not written; duplicates, cross-category codes and unknown sheet columns abort the run.
Result: 21 products changed — price 9798 1950 → 1400 (confirmed by the owner), 18 descriptions, 2 weights,
coating 4904 / 828, insertion + colour 828.

`products.note` (migration `20261113000001_products_note.js`, `text NULL`) stores `Примітка` — internal, not exposed
by the storefront mapper. `Роздрібна` is deliberately not stored (owner decision 2026-11-13).

Apply — one command:

```bash
npm run db:update                          # local Docker DB (.env.local): db:up → db:backup → migrate → patch:specs → dry run → import
npm run db:update -- --production          # production server: asks you to type the DB name, then
                                           # backup → migrate → patch:specs → dry run → import → cache purge
```

`db/update-catalog.js` stops at the first failing step, so nothing is imported without a verified backup and a clean
dry run. Production mode reads `DATABASE_URL` like Next.js (`.env.production.local`, `.env.local`, `.env.production`,
`.env`), dumps the database inside the PostgreSQL container that publishes the `DATABASE_URL` port (the server has no
`pg_dump`; override with `--container=<name>`) into `db/backups/`, checks the dump with `pg_restore --list`, and prints
the restore command. `--yes` skips the prompt; `--site-url=…` sets where `POST /api/catalog/revalidate` goes (needs
`CATALOG_REVALIDATE_SECRET`, otherwise the site updates within 15 min). The content importer refuses production unless
called with `--allow-production`, which only this command passes.

`--update-prices` overwrites `products.price` from `Ціна` (old values → report + `audit_logs`); `Примітка` → `products.note`
(empty keeps). Re-running reports `updated 0`. Restore a backup:
`docker compose --env-file .env.local exec -T postgres pg_restore -U daisy -d daisy_dev --clean --if-exists < db/backups/<file>.dump`.

## Storefront catalog (PostgreSQL)

- Source switch: `CATALOG_SOURCE=postgres` (default) or `dntrade` (rollback; the old DNTrade API code path is unchanged). Restart/rebuild after changing it.
- Data layer: `src/lib/catalog/repository.js` (Knex queries: listing with category / collection / attribute / price / stock / size filters, sorting, pagination, search, product by code, sizes by article, related products, facets, sitemap refs), `mapper.js` (DB row → the product shape the UI already uses; no internal fields), `index.js` (`unstable_cache`, 900 s, tags `catalog` + `products`). Pages use `src/lib/dataCache.js`, which picks the source.
- Visible on the storefront: `products.status = 'active'`, active category, `price` set. Price shown = `sale_price ?? price`.
- Cache purge after DB changes: set `CATALOG_REVALIDATE_SECRET`, then `curl -X POST http://localhost:3000/api/catalog/revalidate -H "Authorization: Bearer <secret>"`. Otherwise changes appear within 900 s.
- Tests: `npm test` (needs `TEST_DATABASE_URL`; the test database is dropped and re-migrated — its name must contain `test`).
