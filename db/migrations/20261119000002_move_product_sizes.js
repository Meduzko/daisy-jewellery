// Moving a product to another category carries its sizes over instead of refusing the move.
// Sizes belong to a category (sizes.category_id, migration 20261116000003); a new category has none,
// so any product with sizes could not be assigned to it. Now, after products.category_id changes,
// each variant's size label is found (or created) in the new category and the variant points to it,
// keeping the variant row (weight, stock). Sizes left in the old category stay (other products use them).
// Deleting a category deletes its sizes: they would otherwise block it after its products moved out.
// Safe: a size in use means a product of that category, and products still block the delete (RESTRICT).

// products_before_write() of migration 20261116000003, without the "has sizes of another type" check.
const beforeWrite = (withSizeCheck) => `
  CREATE OR REPLACE FUNCTION products_before_write() RETURNS trigger LANGUAGE plpgsql AS $$
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
      ${withSizeCheck ? `IF NEW.category_id IS DISTINCT FROM OLD.category_id AND EXISTS (
        SELECT 1 FROM product_variants v JOIN sizes s ON s.id = v.size_id
         WHERE v.product_id = NEW.id AND s.category_id <> NEW.category_id) THEN
        RAISE EXCEPTION 'Товар % має розміри іншого типу товару — спершу приберіть їх', NEW.legacy_code;
      END IF;` : '-- sizes follow a category change: products_move_sizes() (migration 20261119000002)'}
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
  END $$;`;

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.raw(beforeWrite(false));
  // AFTER: the row already has the new category, which product_variants_size() checks.
  await knex.raw(`
    CREATE FUNCTION products_move_sizes() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      INSERT INTO sizes (category_id, label)
      SELECT DISTINCT NEW.category_id, s.label
        FROM product_variants v JOIN sizes s ON s.id = v.size_id
       WHERE v.product_id = NEW.id AND s.category_id <> NEW.category_id
      ON CONFLICT DO NOTHING; -- "15.5" = "15,5" already there (sizes_category_label_unique)

      UPDATE product_variants v SET size_id = target.id
        FROM sizes cur, sizes target
       WHERE v.product_id = NEW.id AND cur.id = v.size_id AND cur.category_id <> NEW.category_id
         AND target.category_id = NEW.category_id
         AND lower(replace(target.label, '.', ',')) = lower(replace(cur.label, '.', ','));
      RETURN NULL;
    END $$;
    CREATE TRIGGER products_move_sizes AFTER UPDATE OF category_id ON products
      FOR EACH ROW WHEN (NEW.category_id IS DISTINCT FROM OLD.category_id)
      EXECUTE FUNCTION products_move_sizes();

    ALTER TABLE sizes DROP CONSTRAINT sizes_category_id_foreign,
      ADD CONSTRAINT sizes_category_id_foreign FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE;

    -- Readable refusal (Directus shows it) before the products FK (RESTRICT) refuses with its raw message.
    CREATE FUNCTION categories_before_delete() RETURNS trigger LANGUAGE plpgsql AS $$
    DECLARE n integer;
    BEGIN
      SELECT count(*) INTO n FROM products WHERE category_id = OLD.id;
      IF n > 0 THEN
        RAISE EXCEPTION 'У категорії «%» % товар(ів) — спершу перенесіть їх в іншу категорію, або зробіть категорію чернеткою',
          (SELECT name FROM category_translations WHERE category_id = OLD.id ORDER BY locale = 'uk' DESC LIMIT 1), n;
      END IF;
      IF EXISTS (SELECT 1 FROM categories WHERE parent_id = OLD.id) THEN
        RAISE EXCEPTION 'Категорія є батьківською для інших — спершу змініть їм «Батьківську категорію»';
      END IF;
      RETURN OLD;
    END $$;
    CREATE TRIGGER categories_before_delete BEFORE DELETE ON categories
      FOR EACH ROW EXECUTE FUNCTION categories_before_delete();
  `);
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.raw(`
    DROP TRIGGER IF EXISTS categories_before_delete ON categories; DROP FUNCTION IF EXISTS categories_before_delete();
    ALTER TABLE sizes DROP CONSTRAINT sizes_category_id_foreign,
      ADD CONSTRAINT sizes_category_id_foreign FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT;
    DROP TRIGGER products_move_sizes ON products; DROP FUNCTION products_move_sizes();
  `);
  await knex.raw(beforeWrite(true));
};
