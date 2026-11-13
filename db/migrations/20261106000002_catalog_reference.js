// Step 2 (architecture §8): locales, categories, suppliers, attributes, attribute_values
// and their translation tables.
//
// Translations: one row per (entity, locale) in `<entity>_translations`.
// The default locale (uk) is the fallback — see the *_i18n views (migration 5).

const { createTranslationTable } = require('../translation-table');
const { ATTRIBUTES } = require('../reference/attributes');

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('locales', (t) => {
    t.text('code').primary({ constraintName: 'locales_pkey' }); // 'uk', 'ru', 'en'…
    t.text('name').notNullable(); // native name: Українська
    t.boolean('is_default').notNullable().defaultTo(false); // fallback locale
    t.boolean('is_active').notNullable().defaultTo(true);
    t.integer('sort_order').notNullable().defaultTo(0);

    t.check("code ~ '^[a-z]{2}(-[A-Z]{2}){0,1}$'", [], 'locales_code_check');
    t.check('NOT is_default OR is_active', [], 'locales_default_active_check');
  });
  // Exactly one default locale at most (enforced) — the fallback for missing translations.
  await knex.raw('CREATE UNIQUE INDEX locales_one_default ON locales (is_default) WHERE is_default');
  // Supported languages (reference data, not product data).
  await knex('locales').insert([
    { code: 'uk', name: 'Українська', is_default: true, sort_order: 1 },
    { code: 'ru', name: 'Русский', is_default: false, sort_order: 2 },
  ]);

  await knex.schema.createTable('categories', (t) => {
    t.increments('id');
    t.text('code').notNullable().unique({ indexName: 'categories_code_unique' }); // rings, earrings, necklaces, bracelets
    t.integer('sort_order').notNullable().defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await createTranslationTable(knex, 'category_translations', 'category_id', 'categories', (t) => {
    t.text('name').notNullable();
    t.text('slug').notNullable();
    t.text('url_prefix'); // e.g. kabluchki/kupyty-sribnu-kabluchku
    t.text('description');
    t.text('seo_title');
    t.text('seo_description');
    t.unique(['locale', 'slug'], { indexName: 'category_translations_locale_slug_unique' });
  });

  await knex.schema.createTable('suppliers', (t) => {
    t.increments('id');
    t.text('name').notNullable().unique({ indexName: 'suppliers_name_unique' }); // internal, not translated
    t.text('contact'); // internal only
    t.text('legacy_id').unique({ indexName: 'suppliers_legacy_id_unique' }); // DNTrade tag-item id
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('attributes', (t) => {
    t.increments('id');
    t.text('code').notNullable().unique({ indexName: 'attributes_code_unique' }); // see db/reference/attributes.js
    t.boolean('is_filterable').notNullable().defaultTo(true);
    t.integer('sort_order').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await createTranslationTable(knex, 'attribute_translations', 'attribute_id', 'attributes', (t) => {
    t.text('name').notNullable();
  });
  // Attribute definitions (reference data; values come from the product imports).
  for (const a of ATTRIBUTES) {
    const [{ id }] = await knex('attributes').insert({ code: a.code, sort_order: a.sort }).returning('id');
    await knex('attribute_translations').insert([
      { attribute_id: id, locale: 'uk', name: a.uk },
      { attribute_id: id, locale: 'ru', name: a.ru },
    ]);
  }

  await knex.schema.createTable('attribute_values', (t) => {
    t.increments('id');
    t.integer('attribute_id').notNullable().references('id').inTable('attributes').onDelete('CASCADE');
    t.text('slug').notNullable(); // language-neutral key used in URL filters
    t.integer('sort_order').notNullable().defaultTo(0);
    t.text('legacy_id').unique({ indexName: 'attribute_values_legacy_id_unique' }); // DNTrade tag-item id
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['attribute_id', 'slug'], { indexName: 'attribute_values_attribute_slug_unique' });
  });

  await createTranslationTable(knex, 'attribute_value_translations', 'attribute_value_id', 'attribute_values', (t) => {
    t.text('value').notNullable();
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTable('attribute_value_translations');
  await knex.schema.dropTable('attribute_values');
  await knex.schema.dropTable('attribute_translations');
  await knex.schema.dropTable('attributes');
  await knex.schema.dropTable('suppliers');
  await knex.schema.dropTable('category_translations');
  await knex.schema.dropTable('categories');
  await knex.schema.dropTable('locales');
};
