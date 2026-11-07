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

## Storefront catalog (PostgreSQL)

- Source switch: `CATALOG_SOURCE=postgres` (default) or `dntrade` (rollback; the old DNTrade API code path is unchanged). Restart/rebuild after changing it.
- Data layer: `src/lib/catalog/repository.js` (Knex queries: listing with category / collection / attribute / price / stock / size filters, sorting, pagination, search, product by code, sizes by article, related products, facets, sitemap refs), `mapper.js` (DB row → the product shape the UI already uses; no internal fields), `index.js` (`unstable_cache`, 900 s, tags `catalog` + `products`). Pages use `src/lib/dataCache.js`, which picks the source.
- Visible on the storefront: `products.status = 'active'`, active category, `price` set. Price shown = `sale_price ?? price`.
- Cache purge after DB changes: set `CATALOG_REVALIDATE_SECRET`, then `curl -X POST http://localhost:3000/api/catalog/revalidate -H "Authorization: Bearer <secret>"`. Otherwise changes appear within 900 s.
- Tests: `npm test` (needs `TEST_DATABASE_URL`; the test database is dropped and re-migrated — its name must contain `test`).
