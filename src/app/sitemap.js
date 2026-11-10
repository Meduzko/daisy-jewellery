import { fetchProduct } from '../actions/fetchProduct';
import { getAllHtmlPosts } from '../lib/posts';
import { getCatalogSource } from '../lib/catalog/source';

// Regenerate sitemap every 24 hours to pick up new products
export const revalidate = 86400;

export default async function sitemap() {
  const baseUrl = process.env.SITE_DOMAIN || process.env.NEXT_PUBLIC_BASE_URL || 'https://daisy-jewellery.com.ua';
  const locales = ['uk', 'ru'];
  
  const localedCategoryItem = {
    uk: {
      ring: 'kabluchki/kupyty-sribnu-kabluchku',
      earring: 'serezhky/kupyty-serezhky-sribni',
      necklace: 'kolye/kupyty-sribne-kolye',
      bracer: 'braslety/kupyty-sribnyy-braslet',
    },
    ru: {
      ring: 'koltsa/kupit-serebryanoye-koltso',
      earring: 'sergi/kupit-serebryanyye-sergi',
      necklace: 'kolye/kupit-serebryanoye-kolye',
      bracer: 'braslety/kupit-serebryanyy-braslet',
    }
  };

  const localedCategory = {
    uk: {
      ring: 'kabluchki',
      earring: 'serezhky',
      necklace: 'kolye',
      bracer: 'braslety',
    },
    ru: {
      ring: 'koltsa',
      earring: 'sergi',
      necklace: 'kolye',
      bracer: 'braslety',
    }
  };

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
        const page = await fetchProduct({
          categoryId,
          limit: pageLimit,
          offset,
          paginated: true
        });

        const products = page?.products || [];
        allProducts.push(...products);

        hasMore = Boolean(page?.hasMore) && products.length > 0;
        offset += pageLimit;
        attempts = 0; // Reset on success
      } catch (error) {
        attempts++;
        console.error(`[Sitemap] Error fetching ${categoryName} (attempt ${attempts}):`, error.message);
        if (attempts >= maxAttempts) break;
        await new Promise(r => setTimeout(r, 1000 * attempts));
      }
    }

    console.log(`[Sitemap] Fetched ${allProducts.length} products for ${categoryName}`);
    return allProducts;
  }

  // Fetch all categories in parallel for better performance
  const [ringProducts, necklaceProducts, earringProducts, bracerProducts] = await Promise.all([
    fetchAllByCategory(process.env.RING_CATEGORY_ID, 'rings', 100, 'ring'),
    fetchAllByCategory(process.env.NECKLACE_CATEGORY_ID, 'necklaces', 100, 'necklace'),
    fetchAllByCategory(process.env.EARING_CATEGORY_ID, 'earrings', 100, 'earring'),
    fetchAllByCategory(process.env.BRACER_CATEGORY_ID, 'bracelets', 100, 'bracer'),
  ]);

  const staticRoutes = ['', 'about', 'contact', 'delivery', 'oferta', 'returns', 'blog'];

  // Helper to create sitemap entries for BOTH locales with hreflang alternates
  const createEntries = (ukPath, ruPath, priority = 0.8) => {
    const alternates = {
      languages: {
        uk: `${baseUrl}/${ukPath}`,
        ru: `${baseUrl}/${ruPath}`,
      },
    };
    
    return [
      {
        url: `${baseUrl}/${ukPath}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority,
        alternates,
      },
      {
        url: `${baseUrl}/${ruPath}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority,
        alternates,
      },
    ];
  };

  // Static routes with hreflang (both /uk and /ru)
  const localizedStaticRoutes = staticRoutes.flatMap((route) => {
    const ukPath = route === '' ? 'uk' : `uk/${route}`;
    const ruPath = route === '' ? 'ru' : `ru/${route}`;
    const priority = route === '' ? 1.0 : 0.7;
    return createEntries(ukPath, ruPath, priority);
  });

  // Blog posts with hreflang (both /uk and /ru)
  const ukBlogPosts = getAllHtmlPosts({ lang: 'uk' });
  const ruBlogPosts = getAllHtmlPosts({ lang: 'ru' });
  
  const blogPostRoutes = ukBlogPosts.flatMap(post => {
    const ruPost = ruBlogPosts.find(rp => rp.slug === post.slug);
    return createEntries(
      `uk/blog/${post.slug}`,
      `ru/blog/${ruPost?.slug || post.slug}`,
      0.6
    );
  });

  // Category pages with hreflang (both /uk and /ru) — one URL per category
  const categoryRoutes = ['ring', 'earring', 'necklace', 'bracer'].flatMap((categoryType) =>
    createEntries(`uk/${localedCategory.uk[categoryType]}`, `ru/${localedCategory.ru[categoryType]}`, 0.9)
  );

  // Product pages with hreflang (both /uk and /ru)
  const createProductRoutes = (products, categoryType) => {
    return products.flatMap(product => createEntries(
      `uk/${localedCategoryItem.uk[categoryType]}/${product.code}`,
      `ru/${localedCategoryItem.ru[categoryType]}/${product.code}`,
      0.8
    ));
  };

  const ringProductRoutes = createProductRoutes(ringProducts, 'ring');
  const necklaceProductRoutes = createProductRoutes(necklaceProducts, 'necklace');
  const earringProductRoutes = createProductRoutes(earringProducts, 'earring');
  const bracerProductRoutes = createProductRoutes(bracerProducts, 'bracer');

  const allRoutes = [
    ...localizedStaticRoutes,
    ...categoryRoutes,
    ...ringProductRoutes,
    ...necklaceProductRoutes,
    ...earringProductRoutes,
    ...bracerProductRoutes,
    ...blogPostRoutes,
  ];

  const totalProducts = ringProducts.length + necklaceProducts.length + earringProducts.length + bracerProducts.length;
  console.log(`[Sitemap] Generated ${allRoutes.length} total URLs (${totalProducts} products × 2 locales)`);

  return allRoutes;
}
