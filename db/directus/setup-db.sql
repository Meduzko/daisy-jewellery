-- Directus database role and schema. Idempotent: re-run after migrations that add CMS tables.
-- Run as the database owner (the app user), against the target database:
--
--   docker compose --env-file .env.local exec -T postgres \
--     psql -v ON_ERROR_STOP=1 -v directus_password="$DIRECTUS_DB_PASSWORD" \
--          -U "$POSTGRES_USER" -d <database> < db/directus/setup-db.sql
--
-- Safety model: Directus owns only the `directus` schema (its system tables). In `public` it owns
-- nothing and has no CREATE, so PostgreSQL itself refuses any ALTER/DROP/TRUNCATE of app tables,
-- whatever is clicked in the Directus Data Model UI. Tables not granted here (admin_users,
-- audit_logs, knex_migrations…) are invisible to Directus.
-- Creating a role needs CREATEROLE; the Docker superuser has it. On a managed server, ask the DBA.

SELECT format('CREATE ROLE directus LOGIN PASSWORD %L', :'directus_password')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'directus') \gexec
ALTER ROLE directus PASSWORD :'directus_password';
ALTER ROLE directus SET search_path = directus, public;

SELECT format('GRANT CONNECT ON DATABASE %I TO directus', current_database()) \gexec
CREATE SCHEMA IF NOT EXISTS directus AUTHORIZATION directus;
GRANT USAGE ON SCHEMA public TO directus;
-- PostgreSQL 15+ grants no CREATE on public to PUBLIC; on older servers Directus could still create
-- new tables there, but never alter existing ones (it owns none).
REVOKE CREATE ON SCHEMA public FROM directus;

-- Catalog and blog: full row access (no DDL).
GRANT SELECT, INSERT, UPDATE, DELETE ON
  products, product_translations, product_variants, product_images, product_attribute_values,
  categories, category_translations, suppliers,
  attributes, attribute_translations, attribute_values, attribute_value_translations,
  collections, collection_translations, collection_products, sizes,
  blog_posts, blog_post_translations
TO directus;

-- Values that make up storefront URLs: never updatable from the CMS (insert still works).
-- Directus Free has no field-level permissions, so this is enforced here, for every CMS user.
REVOKE UPDATE ON products, categories, category_translations FROM directus;
-- sale_price is computed from discount_percent by a trigger (migration 20261116000003), so it is
-- not writable here; legacy_code is generated on insert when left blank.
GRANT UPDATE (category_id, supplier_id, legacy_id, article, price, discount_percent, avg_weight_g, status, note, updated_at)
  ON products TO directus;
GRANT UPDATE (is_active, sort_order, updated_at) ON categories TO directus;
-- `locale` is included because the Directus translations form sends it with every update.
GRANT UPDATE (locale, name, description, seo_title, seo_description, updated_at) ON category_translations TO directus;
REVOKE INSERT, DELETE ON categories FROM directus; -- categories map to hard-coded routes
-- Filter URL keys (?insertion=fianit) and collection codes used in code (new, popular), and the
-- product/language a text belongs to: set on insert, fixed afterwards.
REVOKE UPDATE ON attributes, attribute_values, collections, product_translations FROM directus;
GRANT UPDATE (is_filterable, sort_order, updated_at) ON attributes TO directus;
GRANT UPDATE (attribute_id, sort_order, legacy_id, updated_at) ON attribute_values TO directus;
GRANT UPDATE (is_active, sort_order, updated_at) ON collections TO directus;
GRANT UPDATE (locale, title, slug, short_description, description, seo_title, seo_description, updated_at)
  ON product_translations TO directus; -- `locale` is sent by the translations form with every save

-- Reference / read-only.
GRANT SELECT ON locales, orders, order_items, payments, payment_events TO directus;

-- Orders: only fulfilment columns are writable; totals, buyer and payment data are not.
GRANT UPDATE (status, np_ttn, comment, shipped_at, cancelled_at, updated_at) ON orders TO directus;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO directus;

-- Blog cover images → Directus files. Needs the Directus system tables, so it is skipped on the
-- first run (before Directus has started once) — re-run this script after `npm run cms:up`.
-- Created here by the table owner because Directus may not alter app tables.
DO $$
BEGIN
  IF to_regclass('directus.directus_files') IS NOT NULL
     AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'blog_posts_cover_image_foreign') THEN
    ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_cover_image_foreign
      FOREIGN KEY (cover_image) REFERENCES directus.directus_files (id) ON DELETE SET NULL;
  END IF;
END $$;

-- Product photos uploaded in Directus → Cloudflare R2 (storage location `r2`, compose.cms.yaml).
-- Deleting the file in Directus deletes the R2 object and, through this FK, the photo row.
DO $$
BEGIN
  IF to_regclass('directus.directus_files') IS NOT NULL
     AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'product_images_file_foreign') THEN
    ALTER TABLE product_images ADD CONSTRAINT product_images_file_foreign
      FOREIGN KEY (file) REFERENCES directus.directus_files (id) ON DELETE CASCADE;
  END IF;
END $$;

-- r2_key is derived from the Directus file, never typed: R2 key = STORAGE_R2_ROOT ("cms") + "/" +
-- filename_disk (<file uuid>.<ext>, unique per upload). Rows without a file (DNTrade photos and their
-- verified r2_key from scripts/map-r2-images.js) are left alone.
DO $$
BEGIN
  IF to_regclass('directus.directus_files') IS NOT NULL THEN
    CREATE OR REPLACE FUNCTION product_images_directus_file() RETURNS trigger LANGUAGE plpgsql AS $fn$
    DECLARE f record;
    BEGIN
      IF NEW.file IS NULL THEN
        -- file taken off the row: its key goes too (the CHECK then needs a DNTrade url)
        IF TG_OP = 'UPDATE' AND OLD.file IS NOT NULL THEN NEW.r2_key := NULL; END IF;
        RETURN NEW;
      END IF;
      SELECT storage, filename_disk, type INTO f FROM directus.directus_files WHERE id = NEW.file;
      IF NOT FOUND OR f.filename_disk IS NULL THEN
        RAISE EXCEPTION 'Product photo % is not uploaded', NEW.file;
      END IF;
      IF f.storage IS DISTINCT FROM 'r2' THEN
        RAISE EXCEPTION 'Product photo % is in storage "%", not in R2 — upload it again', NEW.file, f.storage;
      END IF;
      IF f.type NOT IN ('image/jpeg', 'image/png', 'image/webp') THEN
        RAISE EXCEPTION 'Product photo must be JPEG, PNG or WebP (got %)', f.type;
      END IF;
      NEW.r2_key := 'cms/' || f.filename_disk;
      NEW.url := NULL; -- a replaced DNTrade photo must not come back on PRODUCT_IMAGE_SOURCE=dntrade
      RETURN NEW;
    END $fn$;
    DROP TRIGGER IF EXISTS product_images_directus_file ON product_images;
    CREATE TRIGGER product_images_directus_file BEFORE INSERT OR UPDATE ON product_images
      FOR EACH ROW EXECUTE FUNCTION product_images_directus_file();
  END IF;
END $$;
