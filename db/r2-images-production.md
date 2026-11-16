# Product images on Cloudflare R2 — production rollout (Ubuntu VPS)

Two changes, rolled out in this order:

1. **Existing photos** (`<seq>_<code>/…` in R2, uploaded earlier) get `product_images.r2_key` from
   `npm run images:r2`; the site switches to them with `PRODUCT_IMAGE_SOURCE=r2`.
2. **New photos uploaded in Directus** go to R2 (`cms/<uuid>.<ext>`) and are linked by `product_images.file`.

Every step up to 5 leaves the website unchanged. Commands are run on the VPS in the app folder
(`cd /path/to/daisy-jewellery`) unless marked *local*.

## 0. Before you start

- [ ] The code is committed and pushed (migrations `20261116000001`, `20261116000002`, `scripts/map-r2-images.js`, `db/directus/*`, `compose.cms.yaml`, `src/lib/catalog/*`, `next.config.mjs`).
- [ ] Directus already runs on the VPS (`db/directus/README.md` → *Production*). If not, do that first.
- [ ] Cloudflare: bucket `daisy-jewellery-images`, custom domain `images.daisy-jewellery.com.ua` connected and public. Check: `curl -I https://images.daisy-jewellery.com.ua/100_7648/00_1414.10_1.jpg` → `200`, `content-type: image/jpeg`.
- [ ] Two R2 API tokens scoped to this bucket only: **Object Read** (for `images:r2`) and **Object Read & Write** (for Directus). The ones tested locally can be reused.
- [ ] A low-traffic time window (~30 min).

## 1. Backup

```bash
npm run db:backup                                   # dump in db/backups/
pg_restore --list db/backups/<newest>.dump | head   # must list tables, no error
```

Copy the dump off the server too.

## 2. Deploy the code (site unchanged)

```bash
git pull
npm ci              # not --omit=dev: images:r2 needs @aws-sdk/client-s3 (devDependency)
```

Add to the server's `.env.local` (values from your local `.env.local`; never commit them):

```bash
PRODUCT_IMAGE_SOURCE=dntrade        # stays dntrade until step 5
NEXT_PUBLIC_IMAGE_BASE_URL=https://images.daisy-jewellery.com.ua
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...                # read-only token
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=daisy-jewellery-images
DIRECTUS_R2_ENDPOINT=https://<account id>.r2.cloudflarestorage.com
DIRECTUS_R2_ACCESS_KEY_ID=...       # read & write token
DIRECTUS_R2_SECRET_ACCESS_KEY=...
```

Database (both migrations only add columns/constraints; existing rows are untouched):

```bash
npm run db:migrate
set -a; . ./.env.local; set +a       # POSTGRES_USER, POSTGRES_DB, DIRECTUS_DB_PASSWORD for the next command
docker compose --env-file .env.local exec -T postgres psql -v ON_ERROR_STOP=1 \
  -v directus_password="$DIRECTUS_DB_PASSWORD" -U "$POSTGRES_USER" -d "$POSTGRES_DB" < db/directus/setup-db.sql
```

`setup-db.sql` adds the `product_images.file` foreign key and the trigger that fills `r2_key` for
Directus uploads. Check:

```bash
docker compose --env-file .env.local exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc \
  "select tgname from pg_trigger where tgname = 'product_images_directus_file'"   # → product_images_directus_file
```

Build and restart Next.js the way it runs on the server (`npm run build`, then `pm2 restart …` /
`systemctl restart …`). The site still shows DNTrade images.

## 3. Map existing photos to R2 (dry run → approve → apply)

*Local* — copy the download manifest (it is not in Git):

```bash
ssh <user>@<vps> "mkdir -p /path/to/daisy-jewellery/data/product-images"
scp data/product-images/manifest.json <user>@<vps>:/path/to/daisy-jewellery/data/product-images/
```

On the VPS — dry run (reads R2 and the DB, writes nothing to the DB):

```bash
npm run images:r2 -- --env=production
```

It prints a summary and writes `data/product-images/r2-mapping-report.json`. Expected (local result):

| field | expected |
|---|---|
| `r2_images` | ≈ 692 |
| `matched_rows` = `db_image_rows` | ≈ 658 |
| `ambiguous_rows`, `unmapped_rows`, `invalid_r2_objects`, `stored_problems` | 0 |
| `products_whose_main_image_stays_on_dntrade` | 0 |

**Stop and do not apply** if `ambiguous_rows` is large with the reason *"manifest did not record this
URL for this product"*: the production database then has different product ids than the one the
manifest was made from, and the manifest must be regenerated on production first
(`npm run images:download -- --env=production`, then re-check that the R2 keys still match).
A few unmapped/ambiguous rows are fine: they keep their DNTrade image.

When the report looks right:

```bash
npm run images:r2 -- --env=production --apply      # one transaction, only product_images.r2_key
npm run images:r2 -- --env=production --validate   # → changes 0, stored_problems 0, exit code 0
```

Re-running `--apply` is safe (it changes nothing the second time).

## 4. Directus uploads → R2

```bash
npm run cms:up              # recreates the container with STORAGE_LOCATIONS=r2,local
npm run cms:configure       # «Фото» upload field, "products" folder
```

If `cms:configure` says *product_images.file has no foreign key yet*: `docker restart daisy-jewellery-directus-1`, run it again.

Test on an **archived** product (not visible on the site):

1. `https://cms.daisy-jewellery.com.ua` → product → **Фото → Create new** → upload a JPEG; repeat with a PNG and a WebP. Save.
2. Each row shows «Ключ у R2» = `cms/<uuid>.<ext>`; the files are in the Cloudflare dashboard under `cms/`.
3. `curl -I https://images.daisy-jewellery.com.ua/cms/<uuid>.jpg` → `200`, `image/jpeg`.
4. Delete the three files in **File Library** → the rows disappear from the product and the objects from R2.

## 5. Switch the website to R2

In `.env.local`: `PRODUCT_IMAGE_SOURCE=r2`. Rebuild (`NEXT_PUBLIC_IMAGE_BASE_URL` is read at build
time), restart Next.js, then purge the cache:

```bash
npm run build && <restart Next.js>
curl -X POST -H "Authorization: Bearer $CATALOG_REVALIDATE_SECRET" https://daisy-jewellery.com.ua/api/catalog/revalidate
```

The purge is required: without it, cached pages keep DNTrade URLs for up to 15 minutes.

## 6. Verify

```bash
for u in /uk /uk/kabluchki /ru/sergi /uk/kabluchki/kupyty-sribnu-kabluchku/828 "/uk/search?q=1364"; do
  p=$(curl -s "https://daisy-jewellery.com.ua$u")
  echo "$u  r2=$(grep -o images.daisy-jewellery.com.ua <<<"$p" | wc -l)  dntrade=$(grep -o cdn.dntrade.com.ua <<<"$p" | wc -l)"
done
```

- [ ] Every line: `r2` > 0, `dntrade=0` (unless the report listed rows that stay on DNTrade).
- [ ] Product page source: `og:image` and JSON-LD `"image"` point to `images.daisy-jewellery.com.ua`.
- [ ] Optimizer: open a product, DevTools → Network → `/_next/image?url=https%3A%2F%2Fimages…` → `200`, `image/webp` or `avif`.
- [ ] Phone and desktop: homepage, a category, a product gallery (order and main photo as before), cart.
- [ ] Sentry: no new image errors for an hour.

## Rollback

| What | How | Data |
|---|---|---|
| Website images | `PRODUCT_IMAGE_SOURCE=dntrade`, rebuild, restart, purge cache (step 5 commands) | none needed — `url` still holds every DNTrade address. Photos uploaded in Directus have no DNTrade copy and keep loading from R2. |
| Directus uploads | `STORAGE_LOCATIONS: local,r2` in `compose.cms.yaml`, `npm run cms:up` | files already in R2 stay readable; new product photos are then refused by the trigger (by design) |
| Database | `npm run db:rollback` (once per batch) or restore the step-1 dump | the `20261116000002` rollback refuses while Directus-only photos exist — delete them first |

## Notes for editors

See `db/directus/README.md` → *Editing notes → Images*: replace a photo by choosing a new file in its
row, not with «Replace file» in the File Library (caches keep the old picture for up to a week).
