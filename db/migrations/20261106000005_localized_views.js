// Read views with fallback to the default locale (uk).
//
// `<entity>_i18n` has one row per (entity, locale) for every locale in `locales`.
// Each text field is COALESCE(requested locale, default locale), so a missing
// Russian translation — or a single missing Russian field — falls back to
// Ukrainian. `is_fallback` = no row exists for the requested locale.
//
//   SELECT * FROM product_i18n WHERE locale = 'ru' AND product_id = 42;

const VIEWS = [
  { view: 'category_i18n', table: 'category_translations', fk: 'category_id',
    fields: ['name', 'slug', 'url_prefix', 'description', 'seo_title', 'seo_description'] },
  { view: 'product_i18n', table: 'product_translations', fk: 'product_id',
    fields: ['title', 'slug', 'short_description', 'description', 'seo_title', 'seo_description'] },
  { view: 'collection_i18n', table: 'collection_translations', fk: 'collection_id',
    fields: ['name', 'slug', 'description'] },
  { view: 'attribute_i18n', table: 'attribute_translations', fk: 'attribute_id',
    fields: ['name'] },
  { view: 'attribute_value_i18n', table: 'attribute_value_translations', fk: 'attribute_value_id',
    fields: ['value'] },
];

// Entities that have translations: source table of each fk.
const PARENT = {
  category_id: 'categories',
  product_id: 'products',
  collection_id: 'collections',
  attribute_id: 'attributes',
  attribute_value_id: 'attribute_values',
};

function viewSql({ view, table, fk, fields }) {
  const cols = fields.map((f) => `COALESCE(t.${f}, d.${f}) AS ${f}`).join(',\n    ');
  return `
CREATE VIEW ${view} AS
SELECT
    e.id AS ${fk},
    l.code AS locale,
    ${cols},
    (t.${fk} IS NULL) AS is_fallback
FROM ${PARENT[fk]} e
CROSS JOIN locales l
LEFT JOIN ${table} t ON t.${fk} = e.id AND t.locale = l.code
LEFT JOIN locales dl ON dl.is_default
LEFT JOIN ${table} d ON d.${fk} = e.id AND d.locale = dl.code`;
}

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  for (const v of VIEWS) await knex.raw(viewSql(v));
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  for (const { view } of [...VIEWS].reverse()) await knex.raw(`DROP VIEW ${view}`);
};
