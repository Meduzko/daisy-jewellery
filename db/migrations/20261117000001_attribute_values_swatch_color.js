// Colour of the variant swatch dot on the product page for an attribute value (used for «Вставка»):
// '#RRGGBB' set in Directus. NULL = the page falls back to the stone named in the title, then to the photo.

exports.up = async function up(knex) {
  if (await knex.schema.hasColumn('attribute_values', 'swatch_color')) return;
  await knex.schema.alterTable('attribute_values', (t) => {
    t.string('swatch_color', 7);
  });
  await knex.raw(`ALTER TABLE attribute_values ADD CONSTRAINT attribute_values_swatch_color_check
    CHECK (swatch_color IS NULL OR swatch_color ~ '^#[0-9A-Fa-f]{6}$')`);
};

exports.down = async function down(knex) {
  if (!(await knex.schema.hasColumn('attribute_values', 'swatch_color'))) return;
  await knex.raw('ALTER TABLE attribute_values DROP CONSTRAINT IF EXISTS attribute_values_swatch_color_check');
  await knex.schema.alterTable('attribute_values', (t) => {
    t.dropColumn('swatch_color');
  });
};
