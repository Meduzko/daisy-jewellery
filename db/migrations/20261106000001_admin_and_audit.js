// Step 1 (architecture §8): admin_users, audit_logs.

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('admin_users', (t) => {
    t.increments('id');
    t.text('email').notNullable();
    t.text('password_hash').notNullable();
    t.text('name');
    t.text('role').notNullable().defaultTo('manager');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.integer('session_version').notNullable().defaultTo(1); // bump to revoke signed-cookie sessions
    t.timestamp('last_login_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.check("role IN ('owner', 'manager')", [], 'admin_users_role_check');
    t.check('email = lower(email)', [], 'admin_users_email_lowercase_check');
    t.unique(['email'], { indexName: 'admin_users_email_unique' });
  });

  await knex.schema.createTable('audit_logs', (t) => {
    t.bigIncrements('id');
    t.integer('admin_user_id').references('id').inTable('admin_users').onDelete('SET NULL'); // NULL = system
    t.text('action').notNullable();
    t.text('entity_type').notNullable();
    t.text('entity_id');
    t.jsonb('before');
    t.jsonb('after');
    t.specificType('ip', 'inet');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['entity_type', 'entity_id'], 'audit_logs_entity_idx');
    t.index(['admin_user_id'], 'audit_logs_admin_user_idx');
    t.index(['created_at'], 'audit_logs_created_at_idx');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTable('audit_logs');
  await knex.schema.dropTable('admin_users');
};
