// Product photos uploaded in Directus (stored in Cloudflare R2): product_images.file = Directus file id.
// Such rows have no DNTrade URL, so `url` becomes optional; every row still needs a URL or an R2 key.
// The FK to directus.directus_files and the trigger that fills r2_key from the file are created by
// db/directus/setup-db.sql (they need the Directus system tables, like blog_posts.cover_image).

exports.up = async function up(knex) {
  if (!(await knex.schema.hasColumn('product_images', 'file'))) {
    await knex.schema.alterTable('product_images', (t) => {
      t.uuid('file');
      t.index(['file'], 'product_images_file_idx');
    });
  }
  await knex.raw('ALTER TABLE product_images ALTER COLUMN url DROP NOT NULL');
  await knex.raw('ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_source_check');
  await knex.raw('ALTER TABLE product_images ADD CONSTRAINT product_images_source_check CHECK (url IS NOT NULL OR r2_key IS NOT NULL)');
};

exports.down = async function down(knex) {
  // CMS-only rows have no URL to fall back to; refuse instead of deleting photos.
  const { rows } = await knex.raw('SELECT count(*)::int AS n FROM product_images WHERE url IS NULL');
  if (rows[0].n) throw new Error(`${rows[0].n} product_images rows exist only in R2 (url IS NULL); remove them first`);
  await knex.raw('ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_source_check');
  await knex.raw('ALTER TABLE product_images ALTER COLUMN url SET NOT NULL');
  if (await knex.schema.hasColumn('product_images', 'file')) {
    await knex.raw('DROP TRIGGER IF EXISTS product_images_directus_file ON product_images');
    await knex.raw('ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_file_foreign');
    await knex.schema.alterTable('product_images', (t) => {
      t.dropIndex(['file'], 'product_images_file_idx');
      t.dropColumn('file');
    });
  }
};
