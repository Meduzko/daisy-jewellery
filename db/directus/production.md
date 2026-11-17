# Directus on the production VPS — step by step

Ubuntu VPS with PostgreSQL installed natively (`compose.yaml`'s database container is for local
development only), Next.js on the host, Nginx in front. Directus runs in Docker with host networking
(`compose.cms.yaml` + `compose.cms.prod.yaml`): it reaches PostgreSQL on `127.0.0.1:5432` and listens
on `127.0.0.1:8055`; Nginx serves it as `https://cms.daisy-jewellery.com.ua`.

The website keeps reading PostgreSQL directly. Directus going down never takes the shop down.

Do everything first on a **clone** of the production database (step 3), check it, then repeat on the
real database. Commands run in the app folder on the VPS unless marked *local*.

---

## 1. Check the server

```bash
docker --version && docker compose version   # Compose ≥ 2.24.4 (compose.cms.prod.yaml uses !reset)
node --version                               # ≥ 20.12 (cms:configure uses process.loadEnvFile)
systemctl status postgresql --no-pager       # native PostgreSQL is running
sudo -u postgres psql -Atc "select version()"
sudo -u postgres psql -l                     # note the production database name and its owner
nginx -v && certbot --version
sudo ufw status                              # 22, 80, 443 open; 5432 and 8055 NOT open
```

Missing pieces: Docker → `curl -fsSL https://get.docker.com | sh`; certbot →
`sudo apt install certbot python3-certbot-nginx`.

> PostgreSQL in Docker or a managed database instead? Tell me before continuing — only
> `compose.cms.prod.yaml` (`DB_HOST`) and the `psql`/`pg_dump` commands below change.

Set these for the session (used by the commands below):

```bash
cd /path/to/daisy-jewellery
DB=<production database>          # e.g. daisy
APP_USER=<its owner>              # the user in DATABASE_URL
```

## 2. Get the code and the Cloudflare/DNS bits ready

- [ ] *local*: the Directus work is committed and pushed. On the VPS: `git pull && npm ci`.
- [ ] DNS: `A` record `cms.daisy-jewellery.com.ua` → VPS IP (Cloudflare: **DNS only**, grey cloud, so certbot works).
- [ ] Cloudflare R2: an API token with **Object Read & Write** on `daisy-jewellery-images` only (for Directus uploads).

## 3. Backup, then a clone to rehearse on

```bash
sudo mkdir -p /var/backups/daisy && sudo chown "$USER" /var/backups/daisy
sudo -u postgres pg_dump -Fc -d "$DB" > /var/backups/daisy/before-directus-$(date +%F).dump
pg_restore --list /var/backups/daisy/before-directus-*.dump | head   # must list tables
```

*local* — keep a copy off the server: `scp <user>@<vps>:/var/backups/daisy/before-directus-*.dump .`

Clone (owned by the app user, like production):

```bash
sudo -u postgres createdb -O "$APP_USER" daisy_prod_clone
sudo -u postgres pg_restore -d daisy_prod_clone --no-owner --role="$APP_USER" /var/backups/daisy/before-directus-*.dump
```

**Rehearsal:** do steps 4–9 with `DB=daisy_prod_clone`, `DIRECTUS_DB_DATABASE=daisy_prod_clone`, and
the migrations pointed at the clone (step 5). Run the checklist (step 11). Then start again from step 5
with the real `DB` — Nginx/TLS (step 8) is already done by then.

## 4. Environment (`.env.local` on the VPS, never in Git)

Generate secrets: `openssl rand -hex 32` (one per value). Add:

```bash
# Directus
DIRECTUS_DB_DATABASE=daisy_prod_clone          # the real database name after the rehearsal
DIRECTUS_DB_PASSWORD=<random>                  # password of the restricted `directus` DB role
DIRECTUS_SECRET=<random>
DIRECTUS_ADMIN_EMAIL=<your email>
DIRECTUS_ADMIN_PASSWORD=<strong password>      # used only on the very first start
DIRECTUS_PUBLIC_URL=https://cms.daisy-jewellery.com.ua
DIRECTUS_URL=http://127.0.0.1:8055             # where `npm run cms:configure` talks to Directus
DIRECTUS_REVALIDATE_URL=https://daisy-jewellery.com.ua/api/catalog/revalidate
CATALOG_REVALIDATE_SECRET=<random>             # same value Next.js uses (it reads this file too)
# Uploads → Cloudflare R2
DIRECTUS_R2_ENDPOINT=https://<account id>.r2.cloudflarestorage.com
DIRECTUS_R2_ACCESS_KEY_ID=<read & write token>
DIRECTUS_R2_SECRET_ACCESS_KEY=<read & write token>
R2_BUCKET=daisy-jewellery-images
```

```bash
chmod 600 .env.local
env_get() { grep -m1 "^$1=" .env.local | cut -d= -f2-; }   # helper used below
```

## 5. Database: migrations + Directus role

Migrations (as the app user, from `DATABASE_URL`). For the rehearsal point them at the clone:

```bash
# rehearsal only:
#   (your DATABASE_URL with the database name changed to daisy_prod_clone)
DATABASE_URL="postgres://$APP_USER:<password>@127.0.0.1:5432/daisy_prod_clone" npx knex migrate:latest --env production
# real database:
npm run db:migrate
npx knex migrate:status --env production   # "No Pending Migration files Found"
```

Directus role, schema and grants (as the `postgres` superuser: creating a role needs it):

```bash
sudo -u postgres psql -v ON_ERROR_STOP=1 -v directus_password="$(env_get DIRECTUS_DB_PASSWORD)" \
  -d "$DB" < db/directus/setup-db.sql
```

Notices like *schema "directus" already exists, skipping* are fine. The foreign keys to Directus files
and the R2 trigger are skipped this time — they need Directus's own tables, created in step 6.

## 6. First start of Directus

```bash
docker compose -f compose.cms.yaml -f compose.cms.prod.yaml --env-file .env.local up -d --wait directus
docker logs --tail 50 daisy-jewellery-directus-1     # "Server started at http://127.0.0.1:8055"
curl -s http://127.0.0.1:8055/server/ping            # pong
```

The first start creates the `directus.*` tables and the admin user.

Now the second pass of `setup-db.sql` (adds `blog_posts.cover_image` / `product_images.file` foreign
keys and the R2 trigger), restart (Directus caches the schema), configure:

```bash
sudo -u postgres psql -v ON_ERROR_STOP=1 -v directus_password="$(env_get DIRECTUS_DB_PASSWORD)" \
  -d "$DB" < db/directus/setup-db.sql
sudo -u postgres psql -d "$DB" -Atc "select tgname from pg_trigger where tgname = 'product_images_directus_file'"
docker restart daisy-jewellery-directus-1
npm run cms:configure        # labels, forms, «Менеджер» role, Flow «Оновити кеш сайту»
```

`cms:configure` ends with `Directus configured: http://127.0.0.1:8055 …`. It is safe to re-run.

## 7. Restart Next.js

Next.js reads `DIRECTUS_PUBLIC_URL` (blog images) and `CATALOG_REVALIDATE_SECRET` from `.env.local`.
Restart it the way it runs on the server (`pm2 restart …` / `systemctl restart …`).

## 8. Nginx + HTTPS (once)

```bash
sudo certbot certonly --nginx -d cms.daisy-jewellery.com.ua
echo 'limit_req_zone $binary_remote_addr zone=cms_login:10m rate=5r/m;' | sudo tee /etc/nginx/conf.d/cms-ratelimit.conf
sudo cp db/directus/nginx-cms.conf /etc/nginx/sites-available/cms.daisy-jewellery.com.ua
sudo ln -s /etc/nginx/sites-available/cms.daisy-jewellery.com.ua /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
curl -s https://cms.daisy-jewellery.com.ua/server/ping   # pong
```

## 9. First login and users

1. `https://cms.daisy-jewellery.com.ua` → log in with `DIRECTUS_ADMIN_EMAIL` / `DIRECTUS_ADMIN_PASSWORD`.
2. Avatar → change the password, enable **2FA**.
3. In `.env.local` replace `DIRECTUS_ADMIN_PASSWORD` with a new random value (`openssl rand -hex 32`).
   It is only used on the first start, but compose needs the variable to exist.
4. *User Directory → Create user* for each staff member, role **Менеджер**.

## 10. Switch from the clone to the real database

After the checklist passes on the clone:

```bash
docker compose -f compose.cms.yaml -f compose.cms.prod.yaml --env-file .env.local stop directus
DB=<production database>
```

1. In `.env.local`: `DIRECTUS_DB_DATABASE=<production database>`; put back the admin password you want for the first login.
2. Low-traffic time: fresh backup (step 3, first block), then steps 5 → 6 → 7 → 9 on the real database.
3. Run the checklist again, then drop the clone: `sudo -u postgres dropdb daisy_prod_clone`.

## 11. Checklist

- [ ] `ss -ltnp | grep 8055` → `127.0.0.1:8055` only; from your PC `curl -m5 http://<vps ip>:8055` fails
- [ ] Without login: `curl -s https://cms.daisy-jewellery.com.ua/items/products` and `/items/orders` → 403
- [ ] As **Менеджер**: change the price of a test product → the product page shows it within seconds (Flow); edit uk/ru text; add a size; attach an attribute
- [ ] As **Менеджер**: cannot delete a product, change the product code, edit an order total, open Settings
- [ ] Photos (archived test product): upload JPEG, PNG, WebP → «Ключ у R2» = `cms/<uuid>.<ext>`; `curl -I https://images.daisy-jewellery.com.ua/cms/<uuid>.jpg` → 200; delete the files in File Library → rows and R2 objects gone
- [ ] Blog: uk + ru post with a cover → `/uk/blog/<slug>`, `/ru/blog/<slug>`, in `/sitemap.xml`; set «Чернетка» → 404
- [ ] Persistence: `docker compose -f compose.cms.yaml -f compose.cms.prod.yaml --env-file .env.local rm -sf directus`, then step 6's `up` command → users, settings, posts, files still there
- [ ] Shop unchanged: category and product pages, cart, LiqPay test payment

## Later

- **After every `npm run db:migrate`:** `setup-db.sql` (step 5 command), `docker restart daisy-jewellery-directus-1`, `npm run cms:configure`.
- **Directus upgrade:** change the image tag in `compose.cms.yaml` (read the release notes first), backup, step 6 `up` command.
- **Backups:** the `directus` schema is inside the database, so the normal `pg_dump` covers users, settings and the blog. Photos live in R2. Files uploaded before R2 are in the Docker volume `daisy-jewellery-directus-uploads`.

## Rollback

| Problem | Do |
|---|---|
| Directus misbehaves | `docker compose -f compose.cms.yaml -f compose.cms.prod.yaml --env-file .env.local stop directus` — the shop is unaffected |
| A migration broke something | `npm run db:rollback` (one batch at a time), or restore the step-3 dump: `sudo -u postgres pg_restore -d "$DB" --clean --if-exists <dump>` (site downtime while it runs) |
| Remove the CMS for good | stop and remove the container, then `DROP SCHEMA directus CASCADE; DROP ROLE directus;` as `postgres` (the cascade drops only the foreign keys from `blog_posts` / `product_images`, not app data) |
