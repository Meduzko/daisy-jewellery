import * as cheerio from 'cheerio';

// Pure helpers of src/lib/blog.js (no server-only import, so they are unit-testable).

const pad = (n) => String(n).padStart(2, '0');

/**
 * DB row (+ the post's slugs by locale) → the shape the blog pages use for static posts too.
 * `date` is DD.MM.YYYY (Kyiv time) like the static posts; `paths` feed hreflang and the sitemap.
 */
export function toBlogPost(row, slugs, assetsBase) {
  const d = new Date(row.published_at);
  const [y, m, day] = d.toLocaleDateString('en-CA', { timeZone: 'Europe/Kyiv' }).split('-');
  return {
    source: 'cms',
    lang: row.locale,
    slug: row.slug,
    title: row.title,
    seoTitle: row.seo_title || row.title,
    description: row.seo_description || row.excerpt || '',
    excerpt: row.excerpt || row.seo_description || '',
    content: row.content || '',
    image: row.cover_image ? assetsBase + row.cover_image : null,
    date: `${pad(day)}.${pad(m)}.${y}`,
    datePublished: `${y}-${m}-${day}`,
    updatedAt: new Date(row.updated_at).toISOString(),
    paths: { uk: slugs.uk ? `uk/blog/${slugs.uk}` : null, ru: slugs.ru ? `ru/blog/${slugs.ru}` : null },
  };
}

/** Removes scripts, event handlers and javascript: URLs from CMS rich text. */
export function sanitizeHtml(html) {
  const $ = cheerio.load(html || '', null, false);
  $('script, style, iframe, object, embed, form, link, meta, base').remove();
  $('*').each((_, el) => {
    for (const name of Object.keys(el.attribs || {})) {
      const value = el.attribs[name].replace(/[\s\u0000-\u001f]/g, '').toLowerCase();
      if (name.startsWith('on') || (['href', 'src', 'xlink:href', 'action', 'formaction'].includes(name)
        && /^(javascript|vbscript|data:text)/.test(value))) {
        $(el).removeAttr(name);
      }
    }
  });
  return $.html();
}
