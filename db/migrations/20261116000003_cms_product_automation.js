// CMS product automation. Everything runs in PostgreSQL triggers, so it applies to Directus, the
// importers and any other writer alike. Additive: no existing code, slug, price or link is changed.
//
// 1. products.legacy_code (URL code): filled from products_code_seq when left blank on insert.
//    The sequence starts at 100000, above every DNTrade code, so CMS codes never collide with them.
// 2. product_translations.slug: generated from the title (per-locale transliteration, same tables
//    as the importers) + "-<code>" when blank; "-2", "-3"… on a clash. Never rewritten when set.
// 3. product_attribute_values: metal/insertion/coating/other_product_id + _value_id — the same row, routed to
//    one column by its attribute, so Directus can show «Матеріал», «Вставка», «Покриття» as separate
//    fields. product_id stays the column the storefront and importers use.
// 4. sizes (size per category = product type); product_variants.size_id copies label/size into the
//    variant columns the storefront reads.
// 5. products.discount_percent; sale_price is computed from it. Writers that still send sale_price
//    (importers) get the percent derived; a sale price no percent (0.01 step) gives exactly is refused.

const ROUTE = ['metal', 'insertion', 'coating', 'other'];

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  // ---- 5. discount (before the products trigger, which uses it)
  await knex.raw(`
    ALTER TABLE products ADD COLUMN discount_percent numeric(5,2) NOT NULL DEFAULT 0
      CONSTRAINT products_discount_percent_check CHECK (discount_percent BETWEEN 0 AND 100);

    -- Final price: rounded to kopecks; NULL = no discount (keeps "sale_price IS NULL" meaning).
    CREATE FUNCTION product_sale_price(price numeric, pct numeric) RETURNS numeric
    LANGUAGE sql IMMUTABLE AS $$
      SELECT CASE WHEN price > 0 AND pct > 0 AND round(price * (100 - pct) / 100, 2) < price
                  THEN round(price * (100 - pct) / 100, 2) END
    $$;

    UPDATE products SET discount_percent = round((1 - sale_price / price) * 100, 2)
     WHERE sale_price IS NOT NULL AND price > 0;
  `);
  const { rows: inexact } = await knex.raw(`
    SELECT id, legacy_code, price, sale_price, discount_percent FROM products
     WHERE product_sale_price(price, discount_percent) IS DISTINCT FROM sale_price`);
  if (inexact.length) {
    throw new Error(`Sale price not representable as a percentage, fix these first: ${JSON.stringify(inexact)}`);
  }

  // ---- 1. product code
  await knex.raw(`
    CREATE SEQUENCE products_code_seq;
    SELECT setval('products_code_seq', GREATEST(100000,
      (SELECT COALESCE(MAX(legacy_code::bigint), 0) + 1 FROM products WHERE legacy_code ~ '^[0-9]{1,15}$')), false);
    ALTER TABLE products ALTER COLUMN legacy_code SET NOT NULL;
    -- blank = "generate" (trigger); the default also stops Directus from demanding a value
    ALTER TABLE products ALTER COLUMN legacy_code SET DEFAULT '';

    CREATE FUNCTION products_before_write() RETURNS trigger LANGUAGE plpgsql AS $$
    DECLARE
      sale_given boolean;
      computed numeric;
    BEGIN
      NEW.discount_percent := COALESCE(NEW.discount_percent, 0);
      IF TG_OP = 'INSERT' THEN
        IF NULLIF(btrim(NEW.legacy_code), '') IS NULL THEN
          LOOP -- skips codes typed in by hand in the sequence range
            NEW.legacy_code := nextval('products_code_seq')::text;
            EXIT WHEN NOT EXISTS (SELECT 1 FROM products WHERE legacy_code = NEW.legacy_code);
          END LOOP;
        END IF;
        sale_given := NEW.sale_price IS NOT NULL AND NEW.discount_percent = 0;
      ELSE
        sale_given := NEW.sale_price IS DISTINCT FROM OLD.sale_price AND NEW.discount_percent = OLD.discount_percent;
        IF NEW.category_id IS DISTINCT FROM OLD.category_id AND EXISTS (
          SELECT 1 FROM product_variants v JOIN sizes s ON s.id = v.size_id
           WHERE v.product_id = NEW.id AND s.category_id <> NEW.category_id) THEN
          RAISE EXCEPTION 'Товар % має розміри іншого типу товару — спершу приберіть їх', NEW.legacy_code;
        END IF;
      END IF;

      IF sale_given THEN -- legacy writers send sale_price: derive the percent
        IF NEW.sale_price IS NULL THEN
          NEW.discount_percent := 0;
        ELSIF NEW.price IS NULL OR NEW.price <= 0 THEN
          RAISE EXCEPTION 'Ціна зі знижкою без ціни (товар %)', NEW.legacy_code;
        ELSE
          NEW.discount_percent := round((1 - NEW.sale_price / NEW.price) * 100, 2);
        END IF;
      END IF;
      computed := product_sale_price(NEW.price, NEW.discount_percent);
      IF sale_given AND computed IS DISTINCT FROM NEW.sale_price THEN
        RAISE EXCEPTION 'Ціна зі знижкою % при ціні % не відповідає жодному відсотку (крок 0,01%%) — задайте discount_percent',
          NEW.sale_price, NEW.price;
      END IF;
      NEW.sale_price := computed;
      RETURN NEW;
    END $$;
  `);

  // ---- 2. slugs
  await knex.raw(`
    CREATE FUNCTION slugify(txt text, locale text) RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
    DECLARE
      s text := lower(COALESCE(txt, ''));
      -- db/import/lib/catalog-values.js (uk, KMU 2010) and db/import/import-ru-translations.js (ru)
      multi text[] := CASE WHEN locale = 'ru'
        THEN ARRAY['щ','shch','ж','zh','х','kh','ц','ts','ч','ch','ш','sh','ю','yu','я','ya','є','ye']
        ELSE ARRAY['щ','shch','ж','zh','х','kh','ц','ts','ч','ch','ш','sh','ю','iu','я','ia','є','ie'] END;
    BEGIN
      FOR i IN 1..array_length(multi, 1) BY 2 LOOP
        s := replace(s, multi[i], multi[i + 1]);
      END LOOP;
      -- one letter each; ь ъ and apostrophes (past the end of the target list) are removed
      s := translate(s, 'абвгґдеёзиіїйклмнопрстуфыэьъ''’ʼ',
        CASE WHEN locale = 'ru' THEN 'abvggdeeziiiyklmnoprstufye' ELSE 'abvhgdeezyiiiklmnoprstufye' END);
      RETURN btrim(regexp_replace(s, '[^a-z0-9]+', '-', 'g'), '-');
    END $$;

    CREATE FUNCTION product_translations_slug() RETURNS trigger LANGUAGE plpgsql AS $$
    DECLARE
      base text;
      candidate text;
      n integer := 1;
    BEGIN
      IF NULLIF(btrim(NEW.slug), '') IS NOT NULL THEN RETURN NEW; END IF;
      base := concat_ws('-', NULLIF(slugify(NEW.title, NEW.locale), ''),
                        (SELECT lower(legacy_code) FROM products WHERE id = NEW.product_id));
      base := COALESCE(NULLIF(base, ''), 'product');
      candidate := base;
      WHILE EXISTS (SELECT 1 FROM product_translations
                     WHERE locale = NEW.locale AND slug = candidate AND id IS DISTINCT FROM NEW.id) LOOP
        n := n + 1;
        candidate := base || '-' || n;
      END LOOP;
      NEW.slug := candidate;
      RETURN NEW;
    END $$;

    ALTER TABLE product_translations ALTER COLUMN slug SET DEFAULT '';
    CREATE TRIGGER product_translations_slug BEFORE INSERT OR UPDATE OF slug ON product_translations
      FOR EACH ROW EXECUTE FUNCTION product_translations_slug();
  `);

  // ---- 3. attribute routing: each field gets its own pair <slot>_product_id / <slot>_value_id
  // (Directus pairs the two sides of an M2M field by their columns, so fields can't share one).
  for (const r of ROUTE) {
    await knex.raw(`ALTER TABLE product_attribute_values
      ADD COLUMN ${r}_product_id integer
        CONSTRAINT product_attribute_values_${r}_product_id_foreign REFERENCES products(id) ON DELETE CASCADE,
      ADD COLUMN ${r}_value_id integer
        CONSTRAINT product_attribute_values_${r}_value_id_foreign REFERENCES attribute_values(id) ON DELETE CASCADE`);
    await knex.raw(`CREATE INDEX product_attribute_values_${r}_product_idx ON product_attribute_values (${r}_product_id)`);
  }
  const cols = (suffix) => ROUTE.map((r) => `${r}_${suffix}`).join(', ');
  const setSlots = ROUTE.map((r) => `NEW.${r}_product_id := CASE WHEN slot = '${r}' THEN NEW.product_id END;
      NEW.${r}_value_id := CASE WHEN slot = '${r}' THEN NEW.attribute_value_id END;`).join('\n      ');
  await knex.raw(`
    CREATE FUNCTION attribute_slot(value_id integer) RETURNS text LANGUAGE sql STABLE AS $$
      SELECT CASE WHEN a.code IN ('metal', 'insertion', 'coating') THEN a.code ELSE 'other' END
        FROM attribute_values av JOIN attributes a ON a.id = av.attribute_id WHERE av.id = value_id
    $$;

    UPDATE product_attribute_values SET
      ${ROUTE.map((r) => `${r}_product_id = CASE attribute_slot(attribute_value_id) WHEN '${r}' THEN product_id END,
      ${r}_value_id = CASE attribute_slot(attribute_value_id) WHEN '${r}' THEN attribute_value_id END`).join(',\n      ')};

    -- product_id / attribute_value_id are filled by the trigger for Directus writes; NOT NULL moves into
    -- the CHECK because Directus refuses to send a row without a value for a NOT NULL column.
    ALTER TABLE product_attribute_values ALTER COLUMN product_id DROP NOT NULL;
    ALTER TABLE product_attribute_values ALTER COLUMN attribute_value_id DROP NOT NULL;
    ALTER TABLE product_attribute_values ADD CONSTRAINT product_attribute_values_route_check CHECK (
      product_id IS NOT NULL AND attribute_value_id IS NOT NULL
      AND num_nonnulls(${cols('product_id')}) = 1
      AND product_id = COALESCE(${cols('product_id')})
      AND attribute_value_id = COALESCE(${cols('value_id')}));

    CREATE FUNCTION product_attribute_values_route() RETURNS trigger LANGUAGE plpgsql AS $$
    DECLARE slot text;
    BEGIN
      -- Directus writes through the field's columns, importers through product_id / attribute_value_id
      NEW.product_id := COALESCE(NEW.product_id, ${ROUTE.map((r) => `NEW.${r}_product_id`).join(', ')});
      NEW.attribute_value_id := COALESCE(NEW.attribute_value_id, ${ROUTE.map((r) => `NEW.${r}_value_id`).join(', ')});
      slot := attribute_slot(NEW.attribute_value_id);
      IF ${ROUTE.map((r) => `((NEW.${r}_product_id IS NOT NULL OR NEW.${r}_value_id IS NOT NULL) AND slot <> '${r}')`).join('\n         OR ')} THEN
        RAISE EXCEPTION 'Значення атрибута % не належить до цього поля (%)', NEW.attribute_value_id, slot;
      END IF;
      ${setSlots}
      RETURN NEW;
    END $$;
    CREATE TRIGGER product_attribute_values_route BEFORE INSERT OR UPDATE ON product_attribute_values
      FOR EACH ROW EXECUTE FUNCTION product_attribute_values_route();
  `);

  // ---- 4. sizes
  await knex.raw(`
    CREATE TABLE sizes (
      id integer GENERATED BY DEFAULT AS IDENTITY CONSTRAINT sizes_pkey PRIMARY KEY,
      category_id integer NOT NULL CONSTRAINT sizes_category_id_foreign REFERENCES categories(id) ON DELETE RESTRICT,
      label text NOT NULL CONSTRAINT sizes_label_check CHECK (label = btrim(label) AND label <> ''),
      -- numeric size for single sizes ("17,5", "16 см"), as product_variants.size had; NULL for ranges
      -- regexes use {0,1}, not the question-mark quantifier: knex.raw turns that into a bind placeholder
      value numeric(6,2) GENERATED ALWAYS AS (CASE WHEN label ~ '^[0-9]+([.,][0-9]+){0,1} {0,1}(см){0,1}$'
        THEN replace(substring(label FROM '^[0-9]+[.,]{0,1}[0-9]*'), ',', '.')::numeric END) STORED,
      sort_value numeric GENERATED ALWAYS AS (replace(substring(label FROM '^[0-9]+[.,]{0,1}[0-9]*'), ',', '.')::numeric) STORED,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    -- "15.5" and "15,5" are the same size
    CREATE UNIQUE INDEX sizes_category_label_unique ON sizes (category_id, lower(replace(label, '.', ',')));

    ALTER TABLE product_variants ADD COLUMN size_id integer
      CONSTRAINT product_variants_size_id_foreign REFERENCES sizes(id) ON DELETE RESTRICT;
    CREATE INDEX product_variants_size_id_idx ON product_variants (size_id);

    INSERT INTO sizes (category_id, label)
    SELECT DISTINCT p.category_id, replace(btrim(v.size_label), '.', ',')
      FROM product_variants v JOIN products p ON p.id = v.product_id
     WHERE NULLIF(btrim(v.size_label), '') IS NOT NULL
    ON CONFLICT DO NOTHING;

    UPDATE product_variants v SET size_id = s.id
      FROM products p, sizes s
     WHERE p.id = v.product_id AND s.category_id = p.category_id
       AND lower(replace(s.label, '.', ',')) = lower(replace(btrim(v.size_label), '.', ','));
  `);
  const { rows: mismatch } = await knex.raw(`
    SELECT v.id, v.size_label, v.size, s.value FROM product_variants v JOIN sizes s ON s.id = v.size_id
     WHERE v.size IS DISTINCT FROM s.value`);
  if (mismatch.length) throw new Error(`Variant size differs from its label, fix these first: ${JSON.stringify(mismatch)}`);

  await knex.raw(`
    CREATE FUNCTION product_variants_size() RETURNS trigger LANGUAGE plpgsql AS $$
    DECLARE s record;
    BEGIN
      IF NEW.size_id IS NULL THEN
        IF TG_OP = 'UPDATE' AND OLD.size_id IS NOT NULL THEN
          NEW.size_label := NULL;
          NEW.size := NULL;
        END IF;
        RETURN NEW;
      END IF;
      SELECT label, value, category_id INTO s FROM sizes WHERE id = NEW.size_id;
      IF s.category_id IS DISTINCT FROM (SELECT category_id FROM products WHERE id = NEW.product_id) THEN
        RAISE EXCEPTION 'Розмір «%» належить іншому типу товару', s.label;
      END IF;
      NEW.size_label := s.label;
      NEW.size := s.value;
      RETURN NEW;
    END $$;
    CREATE TRIGGER product_variants_size BEFORE INSERT OR UPDATE ON product_variants
      FOR EACH ROW EXECUTE FUNCTION product_variants_size();

    CREATE FUNCTION sizes_propagate() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      UPDATE product_variants SET size_id = size_id WHERE size_id = NEW.id; -- re-runs product_variants_size
      RETURN NULL;
    END $$;
    CREATE TRIGGER sizes_propagate AFTER UPDATE OF label, category_id ON sizes
      FOR EACH ROW EXECUTE FUNCTION sizes_propagate();

    CREATE TRIGGER products_before_write BEFORE INSERT OR UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION products_before_write();
  `);
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.raw(`
    DROP TRIGGER IF EXISTS products_before_write ON products;
    DROP FUNCTION IF EXISTS products_before_write();
    DROP TRIGGER IF EXISTS sizes_propagate ON sizes;
    DROP FUNCTION IF EXISTS sizes_propagate();
    DROP TRIGGER IF EXISTS product_variants_size ON product_variants;
    DROP FUNCTION IF EXISTS product_variants_size();
    ALTER TABLE product_variants DROP COLUMN IF EXISTS size_id;
    DROP TABLE IF EXISTS sizes;

    DROP TRIGGER IF EXISTS product_attribute_values_route ON product_attribute_values;
    DROP FUNCTION IF EXISTS product_attribute_values_route();
    ALTER TABLE product_attribute_values DROP CONSTRAINT IF EXISTS product_attribute_values_route_check;
    ALTER TABLE product_attribute_values ALTER COLUMN product_id SET NOT NULL;
    ALTER TABLE product_attribute_values ALTER COLUMN attribute_value_id SET NOT NULL;
    ${ROUTE.map((r) => `ALTER TABLE product_attribute_values DROP COLUMN IF EXISTS ${r}_product_id, DROP COLUMN IF EXISTS ${r}_value_id;`).join('\n')}
    DROP FUNCTION IF EXISTS attribute_slot(integer);

    DROP TRIGGER IF EXISTS product_translations_slug ON product_translations;
    DROP FUNCTION IF EXISTS product_translations_slug();
    DROP FUNCTION IF EXISTS slugify(text, text);
    ALTER TABLE product_translations ALTER COLUMN slug DROP DEFAULT;

    ALTER TABLE products ALTER COLUMN legacy_code DROP DEFAULT;
    ALTER TABLE products ALTER COLUMN legacy_code DROP NOT NULL;
    DROP SEQUENCE IF EXISTS products_code_seq;
    ALTER TABLE products DROP COLUMN IF EXISTS discount_percent; -- sale_price keeps the computed values
    DROP FUNCTION IF EXISTS product_sale_price(numeric, numeric);
  `);
};
