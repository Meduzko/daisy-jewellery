// DNTrade is no longer used: orders are not uploaded there and the catalog lives only here.
// Drops the DNTrade ids. products.legacy_code stays: it is the product code in storefront URLs.
// Directus field metadata for these columns is removed by db/directus/setup-db.sql.

const COLUMNS = [
  ['products', 'legacy_id'],
  ['product_variants', 'legacy_id'],
  ['product_variants', 'legacy_code'],
  ['suppliers', 'legacy_id'],
  ['attribute_values', 'legacy_id'],
];

exports.up = async function up(knex) {
  for (const [table, column] of COLUMNS) {
    await knex.raw('ALTER TABLE ?? DROP COLUMN IF EXISTS ??', [table, column]);
  }
};

// Restores the empty columns only; the dropped DNTrade ids are not recoverable.
exports.down = async function down(knex) {
  for (const [table, column] of COLUMNS) {
    if (!(await knex.schema.hasColumn(table, column))) {
      await knex.schema.alterTable(table, (t) => {
        t.text(column).unique({ indexName: `${table}_${column}_unique` });
      });
    }
  }
};
