# Rolling out database-driven categories

Applies migrations `20261119000001_category_management.js` , `20261119000002_move_product_sizes.js` (moving a product to another category carries its sizes over) `20261119000003_product_previous_category.js` (✕ in a category's product list returns the product to its previous category) and `20261119000004_category_collection.js` (a category can show a collection's products) and the matching code (dynamic routes
`src/app/[lang]/[category]`, Directus forms for «Категорії»). No new environment variables.

**Order matters.** The migration replaces `categories.is_active` with `status`. The old code reads
`is_active`, and the new code reads `status`, so the code and the schema must change together.
`setup-db.sql` from this version grants the new columns, so it fails on the old schema: run it
after the migration.

---

## Local

Docker PostgreSQL (`compose.yaml`) + Directus (`compose.cms.yaml`), from the project folder.

```bash
git pull && npm ci
npm run db:up
npm run db:backup                         # → db/backups/<db>-<time>.dump
npx knex migrate:status                   # see what is pending (also older migrations, e.g. 20261117000002)
npm run db:migrate
```

Check the data (4 published categories, texts filled, URLs unchanged):

```bash
docker compose --env-file .env.local exec -T postgres psql -U daisy -d daisy_dev -c \
  "select c.code, c.status, t.locale, t.slug, t.url_prefix, t.h1 is not null as has_h1
     from categories c join category_translations t on t.category_id = c.id order by c.sort_order, t.locale"
```

Directus grants, schema cache, admin config (Directus must have started at least once):

```bash
set -a; . ./.env.local; set +a
docker compose --env-file .env.local exec -T postgres psql -v ON_ERROR_STOP=1 \
  -v directus_password="$DIRECTUS_DB_PASSWORD" -U "$POSTGRES_USER" -d "$POSTGRES_DB" < db/directus/setup-db.sql
docker restart daisy-jewellery-directus-1
npm run cms:configure                     # ends with "Directus configured: …"
```

Tests, build, run:

```bash
npm test                                  # TEST_DATABASE_URL (schema is dropped and re-migrated)
npm run build                             # prerenders /uk/kabluchki … and every product page
npm start                                 # or: npm run dev
```

Quick check (server on port 3000):

```bash
for p in /uk/kabluchki /ru/koltsa /uk/serezhky /ru/sergi /uk/kolye /ru/braslety \
         /uk/kabluchki/kupyty-sribnu-kabluchku/828 /ru/kabluchki /uk/nope; do
  printf "%-45s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "http://localhost:3000$p")"
done
# expected: 200 ×7, /ru/kabluchki → 301 /ru/koltsa, /uk/nope → 404
```

In Directus (<http://localhost:8055>) › «Категорії»: create a test category (name only), assign a
product without sizes, publish → `/uk/<slug>` opens, it is in the menu. Then move the product back
and delete the test category.

**Undo locally:** `npx knex migrate:down` (this migration only), `git checkout <previous commit>`,
re-run that version's `setup-db.sql`, restart Directus, `npm run cms:configure`. Or restore the dump:
`docker compose --env-file .env.local exec -T postgres pg_restore -U daisy -d daisy_dev --clean --if-exists < db/backups/<file>.dump`.

---

## VPS (production)

Native PostgreSQL, Next.js on the host, Directus in Docker. Setup: [production.md](production.md).
Commands run in the app folder. Choose a low-traffic time.

```bash
cd /path/to/daisy-jewellery
DB=<production database>                  # e.g. daisy
APP_USER=<its owner>                      # the user in DATABASE_URL
env_get() { grep -m1 "^$1=" .env.local | cut -d= -f2-; }
```

### 1. Code and backup

*local*: commit and push this work. Then on the VPS:

```bash
git pull && npm ci
sudo -u postgres pg_dump -Fc -d "$DB" > /var/backups/daisy/before-categories-$(date +%F).dump
pg_restore --list /var/backups/daisy/before-categories-*.dump | head     # must list tables
```

*local*: keep a copy off the server, e.g. `scp <user>@<vps>:/var/backups/daisy/before-categories-*.dump .`

### 2. Rehearse on a clone (the site keeps running)

```bash
sudo -u postgres createdb -O "$APP_USER" daisy_categories_clone
sudo -u postgres pg_restore -d daisy_categories_clone --no-owner --role="$APP_USER" /var/backups/daisy/before-categories-*.dump
CLONE_URL="postgres://$APP_USER:<password>@127.0.0.1:5432/daisy_categories_clone"   # DATABASE_URL with the clone's name

DATABASE_URL="$CLONE_URL" npx knex migrate:status --env production
DATABASE_URL="$CLONE_URL" npx knex migrate:latest --env production
sudo -u postgres psql -d daisy_categories_clone -c \
  "select c.code, c.status, t.locale, t.slug, t.url_prefix, t.h1 is not null as has_h1
     from categories c join category_translations t on t.category_id = c.id order by c.sort_order, t.locale"
```

Expected: the 4 categories `published`, slugs and `url_prefix` exactly as on the live site, `has_h1` true.
If the migration fails here (e.g. a slug that breaks the new format check), stop and fix the data
first. Production is untouched.

### 3. Build the new version against the clone

The clone has production data and the new schema. Building against it means the old app keeps
serving while the new pages are prerendered:

```bash
DATABASE_URL="$CLONE_URL" npm run build
```

(The shell variable wins over `.env.local` only for the build. At runtime the app uses the real
`DATABASE_URL`.)

> If the build replaces `.next` of the running app in place and that has caused trouble before,
> stop the app first; the downtime is then the build time.

### 4. Switch: migrate the real database, restart

Do these back to back. Between the migration and the restart the old app errors on uncached pages.

```bash
npm run db:migrate
npx knex migrate:status --env production          # "No Pending Migration files Found"
pm2 restart <app>                                 # or: sudo systemctl restart <service>
curl -s -X POST https://daisy-jewellery.com.ua/api/catalog/revalidate \
  -H "Authorization: Bearer $(env_get CATALOG_REVALIDATE_SECRET)"   # purge pages built from the clone
```

### 5. Directus

The restart below is required: Directus caches the schema, and `products.category_id` is now nullable at column level (✕ relies on it).

```bash
sudo -u postgres psql -v ON_ERROR_STOP=1 -v directus_password="$(env_get DIRECTUS_DB_PASSWORD)" \
  -d "$DB" < db/directus/setup-db.sql
sudo -u postgres psql -d "$DB" -Atc "select tgname from pg_trigger where tgname = 'categories_directus_image'"   # 1 row
docker restart daisy-jewellery-directus-1
npm run cms:configure
```

Until this step, saving a category in Directus fails with "permission denied" (old grants). The
site is not affected.

### 6. Check

```bash
for p in /uk/kabluchki /ru/koltsa /uk/serezhky /ru/sergi /uk/kolye /ru/braslety /ru/kabluchki /uk/nope; do
  printf "%-20s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "https://daisy-jewellery.com.ua$p")"
done
curl -s https://daisy-jewellery.com.ua/sitemap.xml | grep -c "<loc>"            # about the same as before
curl -s https://daisy-jewellery.com.ua/ru/koltsa | grep -oE '<link rel="canonical"[^>]*>|<title>[^<]*</title>'
```

- [ ] Header, mobile menu and footer list the 4 categories; homepage «Категорії» shows them with photos
- [ ] A product page opens from a category card; breadcrumbs link back to the category
- [ ] Search page, «Показати ще», filters and sorting on a category page
- [ ] Directus as **Менеджер**: edit a category's meta title → the page shows it within seconds (Flow);
      create a draft test category → not on the site; delete it
- [ ] Deleting a category with products is refused
- [ ] Cart and a LiqPay test payment still work

Then drop the clone: `sudo -u postgres dropdb daisy_categories_clone`.

### Rollback

| Problem | Do |
|---|---|
| Only Directus misbehaves | `docker compose -f compose.cms.yaml -f compose.cms.prod.yaml --env-file .env.local stop directus` (the shop is unaffected) |
| Site broken after the switch | `git checkout <previous commit> && npm ci`, `npx knex migrate:down --env production` (this migration only; `is_active` is restored from `status`), re-run that version's `setup-db.sql`, `npm run build`, restart the app, restart Directus, `npm run cms:configure` |
| Data damaged | Restore the step-1 dump: `sudo -u postgres pg_restore -d "$DB" --clean --if-exists /var/backups/daisy/before-categories-<date>.dump` (edits made since then are lost), then the previous commit's build as above |
