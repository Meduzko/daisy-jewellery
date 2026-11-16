# Directus CMS (admin panel)

Self-hosted **Directus 12.6.1** (`directus/directus:12.6.1`, pinned) on the existing PostgreSQL.
Manages products, categories, orders (view + fulfilment status) and the blog. Next.js keeps
reading the database with Knex; nothing in checkout or payments changed.

| File | What it does |
|---|---|
| `compose.cms.yaml` | Directus service, layered on `compose.yaml` (`npm run cms:up` / `cms:down`) |
| `db/directus/setup-db.sql` | `directus` DB role + `directus` schema + table/column grants (idempotent) |
| `db/directus/configure.mjs` | Labels, navigation, interfaces, relations, layouts, «Менеджер» role, Flow (`npm run cms:configure`, idempotent) |
| `db/directus/nginx-cms.conf` | HTTPS reverse proxy for `cms.daisy-jewellery.com.ua` |
| `db/migrations/20261113000002_single_column_keys.js` | `id` primary key on the 5 translation + 2 junction tables (Directus requirement) |
| `db/migrations/20261113000003_blog.js` | `blog_posts`, `blog_post_translations` |

## How it is kept safe

- **Own schema.** Directus system tables live in the `directus` schema (`DB_SEARCH_PATH=directus,public`); app tables stay in `public`.
- **Restricted DB role.** Directus connects as `directus`, which owns no app table and has no `CREATE` on `public`. PostgreSQL refuses `ALTER/DROP/TRUNCATE` of app tables, whatever is clicked in *Settings → Data Model* (tested: "must be owner of table").
- **Column grants** (Directus Free has no field-level permissions — those need a paid licence key, see *Licence*):
  - orders: only `status`, `np_ttn`, `comment`, `shipped_at`, `cancelled_at` are writable; buyer, totals, payments, payment events are read-only;
  - URL values can't be changed after creation: `products.legacy_code`, category `code`/`slug`/`url_prefix`; categories can't be created or deleted (they map to hard-coded routes);
  - `admin_users`, `audit_logs`, `knex_migrations` are not granted at all (and hidden via `DB_EXCLUDE_TABLES`).
  - New columns in `products` must be added to the `GRANT UPDATE (...)` list in `setup-db.sql` to be editable.
- **No public data.** The public role can read files only (blog images at `/assets/<id>`); no collection is public.
  Directus Free can't restrict that to one folder, so **every uploaded file is public by URL** — upload only website images.
- DB constraints still apply (e.g. sale price < price, slug format). A refused save shows "An unexpected error occurred" to non-admins.

## Local setup

```bash
# 1. .env.local: copy the Directus block from .env.example; generate secrets with `openssl rand -hex 32`.
npm run db:up
npm run db:backup                                   # verified dump in db/backups/
# 2. Test on a clone first (required before touching a real database):
docker compose --env-file .env.local exec postgres psql -U daisy -d postgres -c "CREATE DATABASE daisy_cms_clone"
docker compose --env-file .env.local exec -T postgres pg_restore -U daisy -d daisy_cms_clone --no-owner < db/backups/<file>.dump
DATABASE_URL=postgres://daisy:<pw>@127.0.0.1:5433/daisy_cms_clone npx knex migrate:latest
#    DIRECTUS_DB_DATABASE=daisy_cms_clone in .env.local
docker compose --env-file .env.local exec -T postgres psql -v ON_ERROR_STOP=1 \
  -v directus_password="$DIRECTUS_DB_PASSWORD" -U daisy -d daisy_cms_clone < db/directus/setup-db.sql
npm run cms:up                                      # first start creates the directus.* tables + admin
#    run setup-db.sql once more (adds the blog cover FK, which needs directus_files), then:
docker restart daisy-jewellery-directus-1
npm run cms:configure
```

Admin panel: <http://localhost:8055>. Next.js needs `DIRECTUS_PUBLIC_URL` (cover image URLs) and
`CATALOG_REVALIDATE_SECRET` (the Flow calls `/api/catalog/revalidate`).

## Production (Ubuntu VPS, Docker, Nginx)

Prerequisite: PostgreSQL runs as the `postgres` service of `compose.yaml` on the VPS. If it runs
differently (another compose project, a native install), set `DB_HOST` in `compose.cms.yaml` to that
host / join its Docker network, and drop the `depends_on` block.

1. **Backup**: `pg_dump -Fc` of the production DB → check it with `pg_restore --list <file> | head`. Keep it off the server too.
2. **Rehearse on a clone** of production on the server: restore the dump into `daisy_prod_clone`, run the migrations there, `setup-db.sql`, start Directus with `DIRECTUS_DB_DATABASE=daisy_prod_clone`, `cms:configure`, run the checklist below.
3. **Apply to production** (low-traffic time): `NODE_ENV=production npm run db:migrate` (both migrations are additive; rollback = `npm run db:rollback`), `setup-db.sql`, set `DIRECTUS_DB_DATABASE` to the production DB. Directus bootstraps a fresh `directus` schema there; then `setup-db.sql` again, restart, `cms:configure`.
4. **Env on the VPS** (never in Git): `DIRECTUS_PUBLIC_URL=https://cms.daisy-jewellery.com.ua`, `DIRECTUS_URL=http://127.0.0.1:8055`,
   `DIRECTUS_REVALIDATE_URL=https://daisy-jewellery.com.ua/api/catalog/revalidate` (the public URL works whether or not Next.js listens on the Docker bridge), and the same `DIRECTUS_PUBLIC_URL` + `CATALOG_REVALIDATE_SECRET` in the Next.js environment.
5. **Nginx**: DNS `cms` A-record → VPS, `db/directus/nginx-cms.conf` → `sites-available`, add the `limit_req_zone` line, `certbot`, `nginx -t && systemctl reload nginx`.
6. After the first login remove `DIRECTUS_ADMIN_PASSWORD` from the server env (only used on first bootstrap).
7. Drop the clone database.
8. Product images in Cloudflare R2 (existing photos + Directus uploads): `db/r2-images-production.md`.

Backups: the `directus` schema is inside the same database, so the existing DB dumps include it. New uploads go to Cloudflare R2 (`DIRECTUS_R2_*` env, see `.env.example`); files uploaded before that are in the Docker volume `daisy-jewellery-directus-uploads` — back it up too.

## Admin login and users

- Log in with `DIRECTUS_ADMIN_EMAIL` / `DIRECTUS_ADMIN_PASSWORD`, then change the password (avatar → *Password*) and enable 2FA there.
- Staff: *User Directory → Create user*, role **Менеджер**. Managers edit the catalog and the blog, view orders and change only status/TTN/comment; they cannot delete products (archive: status «Архів»), change URL codes, or touch settings.
- To remove someone, set the user status to **Suspended** (users who uploaded files can't be deleted).

## Editing notes

- **Products**: the Ukrainian text is the fallback for Russian. `legacy_code` is the product URL; `legacy_id` (DNTrade GUID) is needed for an order to reach DNTrade — a product created only in Directus without it can't be fulfilled through the current checkout.
- **Automation** (PostgreSQL triggers, migration `20261116000003_cms_product_automation.js` — work for Directus, importers and SQL alike):
  - *Код* is generated on create when left blank (`products_code_seq`, from 100000 — above every DNTrade code) and never changes.
  - *Slug* (per language, in «Тексти») is generated from the title when blank: transliteration (uk KMU-2010 / ru) + `-<код>`, `-2`… on a clash. Editing the title keeps the slug; clear the slug to regenerate it.
  - *Знижка, %* (0–100) → *Ціна зі знижкою* = ціна × (100 − %) / 100, to kopecks, computed on save (read-only). Importers that still write `sale_price` get the percent derived; a sale price no 0.01 % step gives exactly is refused.
  - *Матеріал / Вставка / Покриття / Інші характеристики* are four fields over the same `product_attribute_values` rows (a trigger copies each row into its field's `<slot>_product_id` / `<slot>_value_id` pair — the Directus app needs a column pair per M2M field); a value of another attribute is refused. New values: «Товари › Атрибути».
  - *Розміри* («Товари › Розміри»): one size per product type (category); `15.5` = `15,5`. In a product, «Розміри» lists the sizes of its category. The link row (`product_variants`) keeps the DNTrade weight/stock, hidden from the form; `size_label`/`size` are copied from the size.
- **After `npm run db:migrate`** (or a rollback) re-run `setup-db.sql` (grants on new tables such as `sizes`), restart Directus (schema cache), then `npm run cms:configure`.
- **Images**: in the product's «Фото» list, *Create new* → upload a JPEG, PNG or WebP. Directus stores it byte for byte in Cloudflare R2 (`cms/<file uuid>.<ext>`, storage location `r2`); `setup-db.sql`'s trigger writes `product_images.r2_key` from the file and refuses other types or files not in R2. Lowest order = main photo; drag to reorder. **Replace** a photo by choosing a new file in its row (old DNTrade photos too: their `url` is cleared so rollback can't bring them back), not with «Replace file» in the File Library — that overwrites the same R2 key, and caches keep the old picture for up to a week. **Remove**: delete the row (the file stays in the library); deleting the file in the File Library deletes the R2 object and every photo row that uses it. Older photos keep their DNTrade `url` (+ `r2_key` from `npm run images:r2`).
- **Search by title**: titles live in *Товари › Тексти товарів* (searchable there); in the product list use the filter *Тексти → Назва*.
- **Blog**: a post appears once its status is «Опубліковано» and it has a Ukrainian text (Russian optional, gets hreflang). Static posts in `src/content/` still render; if a CMS slug equals a static file name, the file wins.
- Edits reach the site within seconds (Flow «Оновити кеш сайту» → `/api/catalog/revalidate`), otherwise within 15 minutes.

## Licence

Directus 12 is under the *Monospace Sustainable Core License* (MSCL-1.0): free for internal use, each version becomes GPL-3.0 four years after release. No licence key is used. Paid-only features (custom permission rules, SSO, custom LLM providers) are not used; MCP is switched off.

## Verification checklist

- [ ] Backup made and `pg_restore --list` works
- [ ] `directus.*` has the system tables; `public` has no `directus_*` tables
- [ ] Data Model: adding a field to `products` fails with "must be owner"
- [ ] Manager can: edit a price (shown on the product page after save), edit uk/ru texts, add a size, attach an attribute value
- [ ] Manager cannot: delete a product, change `legacy_code`, edit an order total, open Settings
- [ ] Without login: `/items/products`, `/items/orders` → 403
- [ ] Blog: create uk + ru post with cover → `/uk/blog/<slug>` and `/ru/blog/<slug>` render, hreflang links point at each other, post is in `/sitemap.xml`; set to «Чернетка» → 404
- [ ] Orders list shows orders with items and payments (once orders are written to PostgreSQL — see below)
- [ ] `docker compose … rm -sf directus && npm run cms:up` → users, settings, posts and files still there
- [ ] Checkout (LiqPay test), product/category pages, SEO URLs and DNTrade images unchanged
