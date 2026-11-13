import { fetchProduct } from '../actions/fetchProduct';
import { getAllHtmlPosts } from '../lib/posts';
import { getCatalogSource } from '../lib/catalog/source';
import { PRODUCT_URL_SLUGS, CATEGORY_SLUGS, absoluteUrl, buildAlternates, localizeSegment } from '../helpers/seo';

// Regenerate sitemap every 24 hours to pick up new products
export const revalidate = 86400;

const CATEGORY_TYPES = ['ring', 'earring', 'necklace', 'bracer'];

async function fetchAllByCategory(categoryId, categoryName, pageLimit = 100, categoryKey) {
  if (getCatalogSource() === 'postgres') {
    try {
      const { getCatalogProductRefs } = await import('../lib/catalog');
      const refs = await getCatalogProductRefs(categoryKey);
      console.log(`[Sitemap] Loaded ${refs.length} products for ${categoryName} from PostgreSQL`);
      return refs;
    } catch (error) {
      console.error(`[Sitemap] Error loading ${categoryName} from PostgreSQL:`, error.message);
      return [];
    }
  }

  if (!categoryId) {
    console.warn(`[Sitemap] Missing category ID for ${categoryName}`);
    return [];
  }

  const allProducts = [];
  let offset = 0;
  let hasMore = true;
  let attempts = 0;
  const maxAttempts = 3;

  while (hasMore && attempts < maxAttempts) {
    try {
      const page = await fetchProduct({ categoryId, limit: pageLimit, offset, paginated: true });
      const products = page?.products || [];
      allProducts.push(...products);
      hasMore = Boolean(page?.hasMore) && products.length > 0;
      offset += pageLimit;
      attempts = 0; // Reset on success
    } catch (error) {
      attempts++;
      console.error(`[Sitemap] Error fetching ${categoryName} (attempt ${attempts}):`, error.message);
      if (attempts >= maxAttempts) break;
      await new Promise((r) => setTimeout(r, 1000 * attempts));
    }
  }

  console.log(`[Sitemap] Fetched ${allProducts.length} products for ${categoryName}`);
  return allProducts;
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
  const productsByCategory = await Promise.all([
    fetchAllByCategory(process.env.RING_CATEGORY_ID, 'rings', 100, 'ring'),
    fetchAllByCategory(process.env.EARING_CATEGORY_ID, 'earrings', 100, 'earring'),
    fetchAllByCategory(process.env.NECKLACE_CATEGORY_ID, 'necklaces', 100, 'necklace'),
    fetchAllByCategory(process.env.BRACER_CATEGORY_ID, 'bracelets', 100, 'bracer'),
  ]);

  // oferta (the public contract) exists in Ukrainian only.
  const staticRoutes = ['', 'about', 'contact', 'delivery', 'oferta', 'returns', 'blog'].flatMap((route) =>
    entries(route ? `uk/${route}` : 'uk', route === 'oferta' ? null : route ? `ru/${route}` : 'ru', { priority: route ? 0.5 : 1.0 })
  );

  const categoryRoutes = CATEGORY_TYPES.flatMap((type) =>
    entries(`uk/${CATEGORY_SLUGS.uk[type]}`, `ru/${CATEGORY_SLUGS.ru[type]}`, { priority: 0.9 })
  );

  const productRoutes = CATEGORY_TYPES.flatMap((type, index) =>
    productsByCategory[index].map((product) => entries(
      `uk/${PRODUCT_URL_SLUGS.uk[type]}/${product.code}`,
      // products without a Russian translation canonicalize their ru URL to uk
      product.hasRu === false ? null : `ru/${PRODUCT_URL_SLUGS.ru[type]}/${product.code}`,
      { priority: 0.8, lastModified: product.updatedAt }
    )).flat()
  );

  const ruSlugs = new Set(getAllHtmlPosts({ lang: 'ru' }).map((post) => post.slug));
  const blogRoutes = getAllHtmlPosts({ lang: 'uk' }).flatMap((post) => {
    const ruSlug = localizeSegment(post.slug, 'ru');
    return entries(`uk/blog/${post.slug}`, ruSlugs.has(ruSlug) ? `ru/blog/${ruSlug}` : null, { priority: 0.6, lastModified: postDate(post.date) });
  });

  const allRoutes = [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
  console.log(`[Sitemap] Generated ${allRoutes.length} URLs (${productsByCategory.flat().length} products)`);
  return allRoutes;
}
