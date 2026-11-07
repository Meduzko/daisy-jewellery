// Shared shape of every <entity>_translations table (used by migrations).
// Changing it later does NOT alter already-applied migrations' tables — add a new migration instead.

/**
 * Translation table: PK (entity FK, locale), FK to locales.
 * @param {import('knex').Knex} knex
 */
function createTranslationTable(knex, table, fk, parent, addColumns) {
  return knex.schema.createTable(table, (t) => {
    t.integer(fk).notNullable().references('id').inTable(parent).onDelete('CASCADE');
    t.text('locale').notNullable().references('code').inTable('locales')
      .onDelete('RESTRICT').onUpdate('CASCADE');
    addColumns(t);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.primary([fk, 'locale'], { constraintName: `${table}_pkey` });
    t.index(['locale'], `${table}_locale_idx`);
  });
}
module.exports = { createTranslationTable };
