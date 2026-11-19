// ✕ next to a product in a category's «Товари» list (Directus) returns the product to its previous
// category. Directus implements ✕ as `category_id = NULL` and refuses that itself for a NOT NULL
// column, so the column becomes nullable and the rule moves to the database: a BEFORE trigger turns
// NULL into the previous category (or refuses with a readable message), and a CHECK keeps
// "every product has a category" for every writer. previous_category_id is recorded on every move.
// Sizes follow the move as before (products_move_sizes, migration 20261119000002).

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.raw(`
    ALTER TABLE products
      ADD COLUMN previous_category_id integer
        CONSTRAINT products_previous_category_id_foreign REFERENCES categories (id) ON DELETE SET NULL,
      ALTER COLUMN category_id DROP NOT NULL,
      ADD CONSTRAINT products_category_required CHECK (category_id IS NOT NULL);

    CREATE FUNCTION products_category() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF NEW.category_id IS NULL THEN
        IF TG_OP = 'INSERT' THEN
          RAISE EXCEPTION 'Оберіть категорію товару';
        END IF;
        -- ✕ in a category's product list: back to where the product was before
        IF OLD.previous_category_id IS NULL OR OLD.previous_category_id = OLD.category_id THEN
          RAISE EXCEPTION 'Товар % не має попередньої категорії — оберіть йому категорію в його картці', OLD.legacy_code;
        END IF;
        NEW.category_id := OLD.previous_category_id;
      END IF;
      IF TG_OP = 'UPDATE' AND NEW.category_id IS DISTINCT FROM OLD.category_id THEN
        NEW.previous_category_id := OLD.category_id;
      END IF;
      RETURN NEW;
    END $$;
    CREATE TRIGGER products_category BEFORE INSERT OR UPDATE OF category_id ON products
      FOR EACH ROW EXECUTE FUNCTION products_category();
  `);
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.raw(`
    DROP TRIGGER IF EXISTS products_category ON products;
    DROP FUNCTION IF EXISTS products_category();
    ALTER TABLE products
      DROP CONSTRAINT products_category_required,
      ALTER COLUMN category_id SET NOT NULL,
      DROP COLUMN previous_category_id;
  `);
};
