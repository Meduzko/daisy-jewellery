import 'server-only';
import { unstable_cache } from 'next/cache';
import { getDb } from './db';
import { sanitizeHtml, toBlogPost } from './blogPost';

// Blog articles edited in Directus (tables blog_posts / blog_post_translations), read directly
// from PostgreSQL like the catalog. The static posts in src/content/ are still served by
// src/lib/posts.js; the blog pages merge both. Purged by POST /api/catalog/revalidate
// (Directus Flow «Оновити кеш сайту») or after 900 s.

export const BLOG_CACHE_TAG = 'blog';

async function queryPublishedPosts() {
  if (!process.env.DATABASE_URL) return [];
  const db = getDb();
  const rows = await db('blog_posts as p')
    .join('blog_post_translations as t', 't.blog_post_id', 'p.id')
    .where('p.status', 'published')
    .select('p.id', 'p.cover_image', 'p.updated_at', 't.locale', 't.title', 't.slug', 't.excerpt', 't.content',
      't.seo_title', 't.seo_description', db.raw('coalesce(p.published_at, p.created_at) AS published_at'))
    .orderBy('published_at', 'desc');

  const assetsBase = `${(process.env.DIRECTUS_PUBLIC_URL || '').replace(/\/$/, '')}/assets/`;
  const slugs = {};
  for (const r of rows) (slugs[r.id] ??= {})[r.locale] = r.slug;
  return rows
    .filter((r) => slugs[r.id].uk) // like products: a Ukrainian text is required before going live
    .map((r) => toBlogPost(r, slugs[r.id], assetsBase))
    // Images inserted in the editor point at Directus; make root-relative ones absolute.
    .map((p) => ({ ...p, content: sanitizeHtml(p.content).replaceAll('"/assets/', `"${assetsBase}`) }));
}

const getPublishedPosts = unstable_cache(queryPublishedPosts, ['blog', 'published'], {
  revalidate: 900,
  tags: [BLOG_CACHE_TAG],
});

/** Published Directus posts in `lang`, newest first. */
export async function getDbPosts(lang) {
  return (await getPublishedPosts()).filter((p) => p.lang === lang);
}

/** One published Directus post by its slug in `lang`, or null. */
export async function getDbPost(slug, lang) {
  return (await getDbPosts(lang)).find((p) => p.slug === slug) ?? null;
}
