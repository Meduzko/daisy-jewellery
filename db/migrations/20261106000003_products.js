// Step 3 (architecture §8): products, product_translations, product_variants,
// product_images, product_attribute_values, collections, collection_translations,
// collection_products.
//
// Money: numeric(10,2) (UAH). Weight: numeric(8,3) grams. Size: numeric(6,2)
// (ring size or chain length). pg returns numeric as strings — no float rounding.

const { createTranslationTable } = require('../translation-table');

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('products', (t) => {
    t.increments('id');
    t.integer('category_id').notNullable().references('id').inTable('categories').onDelete('RESTRICT');
    t.integer('supplier_id').references('id').inTable('suppliers').onDelete('SET NULL');
    t.text('legacy_id').unique({ indexName: 'products_legacy_id_unique' }); // DNTrade GUID
    t.text('legacy_code').unique({ indexName: 'products_legacy_code_unique' }); // DNTrade `code`, used in current URLs
    t.text('article'); // Артикул — NOT unique (shared across cards)
    t.decimal('price', 10, 2);
    t.decimal('sale_price', 10, 2);
    t.text('status').notNullable().defaultTo('draft');
    t.timestamp('source_created_at', { useTz: true }); // original DNTrade creation date
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.check("status IN ('draft', 'active', 'archived')", [], 'products_status_check');
    t.check('price IS NULL OR price >= 0', [], 'products_price_check');
    t.check(
      'sale_price IS NULL OR (sale_price >= 0 AND price IS NOT NULL AND sale_price < price)',
      [],
      'products_sale_price_check'
    );
    t.index(['category_id', 'status'], 'products_category_status_idx');
    t.index(['supplier_id'], 'products_supplier_idx');
    t.index(['article'], 'products_article_idx');
  });

  await createTranslationTable(knex, 'product_translations', 'product_id', 'products', (t) => {
    t.text('title').notNullable();
    t.text('slug').notNullable();
    t.text('short_description');
    t.text('description');
    t.text('seo_title');
    t.text('seo_description');
    // Unique per locale across the shop (stricter than per-category, so category-scoped URLs also work).
    t.unique(['locale', 'slug'], { indexName: 'product_translations_locale_slug_unique' });
  });

  await knex.schema.createTable('product_variants', (t) => {
    t.increments('id');
    t.integer('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.text('size_label'); // as shown to the customer, e.g. "17" or "45 см"
    t.decimal('size', 6, 2); // numeric size for sorting/filtering
    t.decimal('weight_g', 8, 3);
    t.decimal('price', 10, 2); // override of product price
    t.decimal('cost_price', 10, 2); // internal purchase price
    t.integer('stock_qty'); // NULL = not tracked
    t.text('legacy_id').unique({ indexName: 'product_variants_legacy_id_unique' }); // DNTrade GUID
    t.text('legacy_code').unique({ indexName: 'product_variants_legacy_code_unique' }); // DNTrade `code`
    t.text('barcode');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.check('weight_g IS NULL OR weight_g > 0', [], 'product_variants_weight_check');
    t.check('size IS NULL OR size > 0', [], 'product_variants_size_check');
    t.check('price IS NULL OR price >= 0', [], 'product_variants_price_check');
    t.check('cost_price IS NULL OR cost_price >= 0', [], 'product_variants_cost_price_check');
    t.check('stock_qty IS NULL OR stock_qty >= 0', [], 'product_variants_stock_qty_check');
    t.index(['product_id', 'size'], 'product_variants_product_size_idx');
    t.index(['barcode'], 'product_variants_barcode_idx');
  });

  await knex.schema.createTable('product_images', (t) => {
    t.increments('id');
    t.integer('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.text('url').notNullable(); // URL or storage path
    t.integer('sort_order').notNullable().defaultTo(0); // lowest = main image
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['product_id', 'sort_order'], 'product_images_product_sort_idx');
  });

  await knex.schema.createTable('product_attribute_values', (t) => {
    t.integer('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.integer('attribute_value_id').notNullable().references('id').inTable('attribute_values').onDelete('CASCADE');

    t.primary(['product_id', 'attribute_value_id'], { constraintName: 'product_attribute_values_pkey' });
    t.index(['attribute_value_id'], 'product_attribute_values_value_idx');
  });

  await knex.schema.createTable('collections', (t) => {
    t.increments('id');
    t.text('code').notNullable().unique({ indexName: 'collections_code_unique' }); // clover, new, popular…
    t.integer('sort_order').notNullable().defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await createTranslationTable(knex, 'collection_translations', 'collection_id', 'collections', (t) => {
    t.text('name').notNullable();
    t.text('slug').notNullable();
    t.text('description');
    t.unique(['locale', 'slug'], { indexName: 'collection_translations_locale_slug_unique' });
  });

  await knex.schema.createTable('collection_products', (t) => {
    t.integer('collection_id').notNullable().references('id').inTable('collections').onDelete('CASCADE');
    t.integer('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.integer('position').notNullable().defaultTo(0);

    t.primary(['collection_id', 'product_id'], { constraintName: 'collection_products_pkey' });
    t.index(['product_id'], 'collection_products_product_idx');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTable('collection_products');
  await knex.schema.dropTable('collection_translations');
  await knex.schema.dropTable('collections');
  await knex.schema.dropTable('product_attribute_values');
  await knex.schema.dropTable('product_images');
  await knex.schema.dropTable('product_variants');
  await knex.schema.dropTable('product_translations');
  await knex.schema.dropTable('products');
};
