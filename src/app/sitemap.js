import { getAllHtmlPosts } from '../lib/posts';
import { getDbPosts } from '../lib/blog';
import { absoluteUrl, buildAlternates, localizeSegment } from '../helpers/seo';
import { getCachedCategories } from '../lib/dataCache';
import { categoryPaths } from '../lib/catalog/categories';

// Regenerate sitemap every 24 hours to pick up new products
export const revalidate = 86400;

async function fetchAllByCategory(categoryName, categoryKey) {
  try {
    const { getCatalogProductRefs } = await import('../lib/catalog');
    const refs = await getCatalogProductRefs(categoryKey);
    console.log(`[Sitemap] Loaded ${refs.length} products for ${categoryName}`);
    return refs;
  } catch (error) {
    console.error(`[Sitemap] Error loading ${categoryName}:`, error.message);
    return [];
  }
}

/**
 * Sitemap entries for one page: the uk URL, plus the ru URL when the page has a real
 * Russian version, each listing both as hreflang alternates (+ x-default = uk).
 * `lastModified` only when known (product updated_at, blog post date) — never "now".
 */
function entries(ukPath, ruPath, { priority = 0.8, lastModified } = {}) {
  const { languages } = buildAlternates('uk', { uk: ukPath, ru: ruPath });
  return [ukPath, ruPath].filter(Boolean).map((path) => ({
    url: absoluteUrl(path),
    ...(lastModified ? { lastModified } : {}),
    changeFrequency: 'weekly',
    priority,
    alternates: { languages },
  }));
}

const postDate = (date) => {
  const [day, month, year] = String(date || '').split('.');
  return year && month && day ? `${year}-${month}-${day}` : undefined;
};

export default async function sitemap() {
  // Published categories only (drafts are 404); empty ones are left out (their page is 404 too).
  // Product URLs come from each product's own category (refs), never from a collection category.
  const categories = await getCachedCategories();
  const productsByCategory = await Promise.all(categories.map((c) => fetchAllByCategory(c.code, c.key)));

  // oferta (the public contract) exists in Ukrainian only.
  const staticRoutes = ['', 'about', 'contact', 'delivery', 'oferta', 'returns', 'blog'].flatMap((route) =>
    entries(route ? `uk/${route}` : 'uk', route === 'oferta' ? null : route ? `ru/${route}` : 'ru', { priority: route ? 0.5 : 1.0 })
  );

  const categoryRoutes = categories.flatMap((category) => {
    if (!category.productCount) return []; // its page is 404 (a collection category lists other categories' products)
    const paths = categoryPaths(category);
    return entries(paths.uk, paths.ru, { priority: 0.9 });
  });

  const productRoutes = categories.flatMap((category, index) =>
    productsByCategory[index].map((product) => entries(
      `uk/${category.uk.urlPrefix}/${product.code}`,
      // products (or categories) without a Russian translation canonicalize their ru URL to uk
      product.hasRu === false || category.ru.isFallback ? null : `ru/${category.ru.urlPrefix}/${product.code}`,
      { priority: 0.8, lastModified: product.updatedAt }
    )).flat()
  );

  const ruSlugs = new Set(getAllHtmlPosts({ lang: 'ru' }).map((post) => post.slug));
  const blogRoutes = getAllHtmlPosts({ lang: 'uk' }).flatMap((post) => {
    const ruSlug = localizeSegment(post.slug, 'ru');
    return entries(`uk/blog/${post.slug}`, ruSlugs.has(ruSlug) ? `ru/blog/${ruSlug}` : null, { priority: 0.6, lastModified: postDate(post.date) });
  });

  const cmsBlogRoutes = (await getDbPosts('uk')).flatMap((post) =>
    entries(post.paths.uk, post.paths.ru, { priority: 0.6, lastModified: post.updatedAt })
  );

  const allRoutes = [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes, ...cmsBlogRoutes];
  console.log(`[Sitemap] Generated ${allRoutes.length} URLs (${productsByCategory.flat().length} products)`);
  return allRoutes;
}
