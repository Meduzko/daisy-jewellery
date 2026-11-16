// Blog articles edited in Directus and rendered by src/app/[lang]/blog.
// `cover_image` holds a Directus file id (directus.directus_files) — no FK, because Directus
// system tables live in their own schema and are created after this migration.
// The older static posts in src/content/ stay where they are; the blog pages show both.

const SLUG_CHECK = "slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'";

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('blog_posts', (t) => {
    t.increments('id');
    t.text('status').notNullable().defaultTo('draft');
    t.uuid('cover_image');
    t.timestamp('published_at', { useTz: true }); // shown date; set on first publish if empty
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.check("status IN ('draft', 'published')", [], 'blog_posts_status_check');
    t.index(['status', 'published_at'], 'blog_posts_status_published_idx');
  });

  await knex.schema.createTable('blog_post_translations', (t) => {
    t.increments('id');
    t.integer('blog_post_id').notNullable().references('id').inTable('blog_posts').onDelete('CASCADE');
    t.text('locale').notNullable().references('code').inTable('locales').onDelete('RESTRICT').onUpdate('CASCADE');
    t.text('title').notNullable();
    t.text('slug').notNullable();
    t.text('excerpt'); // listing text; falls back to the SEO description
    t.text('content'); // rich-text HTML
    t.text('seo_title');
    t.text('seo_description');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.check(SLUG_CHECK, [], 'blog_post_translations_slug_check');
    t.unique(['blog_post_id', 'locale'], { indexName: 'blog_post_translations_post_locale_unique' });
    t.unique(['locale', 'slug'], { indexName: 'blog_post_translations_locale_slug_unique' });
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTable('blog_post_translations');
  await knex.schema.dropTable('blog_posts');
};
