// Categories managed in Directus (docs: db/directus/README.md › Categories).
//
// categories: status (draft/published, replaces is_active), optional parent, image (Directus file in
//   R2 → image_r2_key, trigger in db/directus/setup-db.sql), navigation / homepage visibility.
//   `code` is generated on insert when blank (category-<id>); the four original categories keep
//   theirs (rings, earrings, necklaces, bracelets).
// category_translations: h1 and seo_bottom_text. seo_title / seo_description are the meta title and
//   description. The slug is generated from the name when blank (never regenerated when the name
//   changes); url_prefix (product URLs: <slug>/<item part>) follows the slug.
// Texts of the original categories are copied from db/reference/categories.js into empty fields.
// Products stay one-to-many (products.category_id, ON DELETE RESTRICT): a category with products
// cannot be deleted.

const { fillCategoryTexts } = require('../reference/categories');

// First URL segments taken by other pages (src/app/[lang]/*) and the storefront keys that the app
// maps to the original categories (src/lib/catalog/categories.js).
const RESERVED_SLUGS = ['about', 'api', 'blog', 'contact', 'delivery', 'oferta', 'order', 'payment-success', 'returns', 'search'];
const LEGACY_KEYS = ['ring', 'earring', 'necklace', 'bracer'];
const SLUG_RE = '^[a-z0-9]+(-[a-z0-9]+)*$';
const sqlList = (values) => values.map((v) => `'${v}'`).join(', ');

const I18N_FIELDS = ['name', 'slug', 'url_prefix', 'description', 'seo_title', 'seo_description'];

function i18nView(fields) {
  const cols = fields.map((f) => `COALESCE(t.${f}, d.${f}) AS ${f}`).join(',\n    ');
  return `
CREATE VIEW category_i18n AS
SELECT
    e.id AS category_id,
    l.code AS locale,
    ${cols},
    (t.category_id IS NULL) AS is_fallback
FROM categories e
CROSS JOIN locales l
LEFT JOIN category_translations t ON t.category_id = e.id AND t.locale = l.code
LEFT JOIN locales dl ON dl.is_default
LEFT JOIN category_translations d ON d.category_id = e.id AND d.locale = dl.code`;
}

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.raw(`
    ALTER TABLE categories
      ADD COLUMN status text NOT NULL DEFAULT 'draft'
        CONSTRAINT categories_status_check CHECK (status IN ('published', 'draft')),
      ADD COLUMN parent_id integer CONSTRAINT categories_parent_id_foreign REFERENCES categories (id) ON DELETE RESTRICT,
      ADD COLUMN image uuid,
      ADD COLUMN image_r2_key text,
      ADD COLUMN show_in_navigation boolean NOT NULL DEFAULT true,
      ADD COLUMN show_on_homepage boolean NOT NULL DEFAULT false,
      ADD CONSTRAINT categories_parent_not_self CHECK (parent_id IS DISTINCT FROM id);
    UPDATE categories SET status = CASE WHEN is_active THEN 'published' ELSE 'draft' END,
                          show_on_homepage = true;
    ALTER TABLE categories DROP COLUMN is_active;
    CREATE INDEX categories_parent_id_idx ON categories (parent_id);

    ALTER TABLE categories ALTER COLUMN code SET DEFAULT '';
    ALTER TABLE categories ADD CONSTRAINT categories_code_check
      CHECK (code ~ '${SLUG_RE}' AND code NOT IN (${sqlList(LEGACY_KEYS)}));

    CREATE FUNCTION categories_before_write() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF TG_OP = 'INSERT' AND NULLIF(btrim(NEW.code), '') IS NULL THEN
        NEW.code := 'category-' || NEW.id;
      END IF;
      IF NEW.parent_id IS NOT NULL AND EXISTS (
        WITH RECURSIVE up(id) AS (
          SELECT NEW.parent_id
          UNION
          SELECT c.parent_id FROM categories c JOIN up ON c.id = up.id WHERE c.parent_id IS NOT NULL
        ) SELECT 1 FROM up WHERE id = NEW.id) THEN
        RAISE EXCEPTION 'A category cannot be its own parent (directly or through other categories)';
      END IF;
      RETURN NEW;
    END $$;
    CREATE TRIGGER categories_before_write BEFORE INSERT OR UPDATE OF code, parent_id ON categories
      FOR EACH ROW EXECUTE FUNCTION categories_before_write();
  `);

  await knex.raw(`
    ALTER TABLE category_translations
      ADD COLUMN h1 text,
      ADD COLUMN seo_bottom_text text;
    -- '' = generate (trigger below); a default also keeps Directus from marking them required
    ALTER TABLE category_translations ALTER COLUMN slug SET DEFAULT '', ALTER COLUMN url_prefix SET DEFAULT '';

    CREATE FUNCTION category_translations_slug() RETURNS trigger LANGUAGE plpgsql AS $$
    DECLARE
      base text;
      candidate text;
      n integer := 1;
      item text;
    BEGIN
      IF NULLIF(btrim(NEW.slug), '') IS NULL THEN
        base := COALESCE(NULLIF(slugify(NEW.name, NEW.locale), ''), 'category');
        candidate := base;
        WHILE candidate IN (${sqlList(RESERVED_SLUGS)}) OR EXISTS (
          SELECT 1 FROM category_translations
           WHERE locale = NEW.locale AND slug = candidate AND id IS DISTINCT FROM NEW.id) LOOP
          n := n + 1;
          candidate := base || '-' || n;
        END LOOP;
        NEW.slug := candidate;
      END IF;
      -- product URLs: /<locale>/<slug>/<item part>/<code>; the item part survives slug changes
      item := split_part(COALESCE(NEW.url_prefix, ''), '/', 2);
      IF item = '' THEN
        item := CASE WHEN NEW.locale = 'ru' THEN 'kupit-' ELSE 'kupyty-' END || NEW.slug;
      END IF;
      NEW.url_prefix := NEW.slug || '/' || item;
      RETURN NEW;
    END $$;
    CREATE TRIGGER category_translations_slug BEFORE INSERT OR UPDATE ON category_translations
      FOR EACH ROW EXECUTE FUNCTION category_translations_slug();

    UPDATE category_translations SET slug = slug WHERE url_prefix IS NULL OR url_prefix NOT LIKE slug || '/%';
    ALTER TABLE category_translations ALTER COLUMN url_prefix SET NOT NULL;
    ALTER TABLE category_translations
      ADD CONSTRAINT category_translations_slug_check
        CHECK (slug ~ '${SLUG_RE}' AND slug NOT IN (${sqlList(RESERVED_SLUGS)})),
      ADD CONSTRAINT category_translations_url_prefix_check
        CHECK (url_prefix = slug || '/' || split_part(url_prefix, '/', 2)
               AND split_part(url_prefix, '/', 2) ~ '${SLUG_RE}');
  `);

  await knex.raw('DROP VIEW category_i18n');
  await knex.raw(i18nView([...I18N_FIELDS, 'h1', 'seo_bottom_text']));

  await fillCategoryTexts(knex);
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.raw('DROP VIEW category_i18n');
  await knex.raw(i18nView(I18N_FIELDS));
  await knex.raw(`
    DROP TRIGGER category_translations_slug ON category_translations;
    DROP FUNCTION category_translations_slug();
    ALTER TABLE category_translations
      DROP CONSTRAINT category_translations_slug_check,
      DROP CONSTRAINT category_translations_url_prefix_check,
      ALTER COLUMN slug DROP DEFAULT,
      ALTER COLUMN url_prefix DROP DEFAULT,
      ALTER COLUMN url_prefix DROP NOT NULL,
      DROP COLUMN h1,
      DROP COLUMN seo_bottom_text;

    -- photo trigger added by db/directus/setup-db.sql (depends on categories.image)
    DROP TRIGGER IF EXISTS categories_directus_image ON categories;
    DROP FUNCTION IF EXISTS categories_directus_image();
    DROP TRIGGER categories_before_write ON categories;
    DROP FUNCTION categories_before_write();
    ALTER TABLE categories DROP CONSTRAINT categories_code_check, ALTER COLUMN code DROP DEFAULT;
    ALTER TABLE categories ADD COLUMN is_active boolean NOT NULL DEFAULT true;
    UPDATE categories SET is_active = (status = 'published');
    ALTER TABLE categories
      DROP COLUMN status, DROP COLUMN parent_id, DROP COLUMN image, DROP COLUMN image_r2_key,
      DROP COLUMN show_in_navigation, DROP COLUMN show_on_homepage;
  `);
};
