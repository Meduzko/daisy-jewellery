// Cloudflare R2 object key of each product image (e.g. "100_7648/00_1414.10_1.jpg").
// Filled only by scripts/map-r2-images.js from verified mappings; NULL = use `url` (DNTrade).
// `url` keeps the DNTrade address, so PRODUCT_IMAGE_SOURCE=dntrade rolls back without a data restore.

exports.up = async function up(knex) {
  if (await knex.schema.hasColumn('product_images', 'r2_key')) return;
  await knex.schema.alterTable('product_images', (t) => {
    t.text('r2_key');
  });
};

exports.down = async function down(knex) {
  if (!(await knex.schema.hasColumn('product_images', 'r2_key'))) return;
  await knex.schema.alterTable('product_images', (t) => {
    t.dropColumn('r2_key');
  });
};
