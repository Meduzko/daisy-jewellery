// products.note — «Примітка» from the DNTrade category exports (db/products_csv/).
// Internal note: stored in PostgreSQL so the CSVs carry no unmapped product data, never shown
// on the storefront (src/lib/catalog/mapper.js does not expose it). Optional → nullable.
// Additive only: no table is recreated, no existing data is touched.

exports.up = async function up(knex) {
  if (!(await knex.schema.hasColumn('products', 'note'))) {
    await knex.schema.alterTable('products', (t) => {
      t.text('note'); // NULL = no note
    });
  }
};

exports.down = async function down(knex) {
  if (await knex.schema.hasColumn('products', 'note')) {
    await knex.schema.alterTable('products', (t) => {
      t.dropColumn('note');
    });
  }
};
