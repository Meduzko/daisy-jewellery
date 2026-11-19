// A category can show a collection (categories.collection_id): its page lists the products of that
// collection (collection_products), which keep their own category and product URLs. Without it, the
// category lists its own products (products.category_id) as before. See repository.applyFilters.

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.raw(`
    ALTER TABLE categories ADD COLUMN collection_id integer
      CONSTRAINT categories_collection_id_foreign REFERENCES collections (id) ON DELETE SET NULL;
    CREATE INDEX categories_collection_id_idx ON categories (collection_id);
  `);
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.raw('ALTER TABLE categories DROP COLUMN collection_id');
};
