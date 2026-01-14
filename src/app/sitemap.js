import { fetchProduct } from '../actions/fetchProduct';
import { getAllHtmlPosts } from '../lib/posts';

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
  }

  // Fetch all products for a category by paging through the API
  async function fetchAllByCategory(categoryId, pageLimit = 100) {
    const allProducts = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
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
    }

    return allProducts;
  }

  const limitPerPage = 16;
  const ringProducts = await fetchAllByCategory(process.env.RING_CATEGORY_ID, 100);
  const necklaceProducts = await fetchAllByCategory(process.env.NECKLACE_CATEGORY_ID, 100);
  const earringProducts = await fetchAllByCategory(process.env.EARING_CATEGORY_ID, 100);
  const bracerProducts = await fetchAllByCategory(process.env.BRACER_CATEGORY_ID, 100);

  const ringPages = Math.ceil(ringProducts?.length / limitPerPage) || 6;
  const necklacePages = Math.ceil(necklaceProducts?.length / limitPerPage) || 3;
  const earringPages = Math.ceil(earringProducts?.length / limitPerPage) || 4;
  const bracerPages = Math.ceil(bracerProducts?.length / limitPerPage) || 3;

  // These are your "base" routes for each locale
  const staticRoutes = ['', 'about', 'contact', 'delivery', 'oferta', 'returns', 'blog'];

  // Blog posts
  const dynamicBlogPostsRU = getAllHtmlPosts({ lang: 'ru' }).map(blogPost => ({
    url: `${baseUrl}/ru/blog/${blogPost.slug}`,
    lastModified: new Date().toISOString(),
  }));

  const dynamicBlogPostsUK = getAllHtmlPosts({ lang: 'uk' }).map(blogPost => ({
    url: `${baseUrl}/uk/blog/${blogPost.slug}`,
    lastModified: new Date().toISOString(),
  }));

  // Helper to build localized static routes
  const localizedStaticRoutes = locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url:
        route === ''
          ? `${baseUrl}/${locale}` // Handle home route
          : `${baseUrl}/${locale}/${route}`,
      lastModified: new Date().toISOString(),
    }))
  );

  // Categories
  const dynamicRingCategoryRoutes = Array.from({ length: ringPages }, (_, index) =>
    locales.flatMap((locale) => ({
      url: `${baseUrl}/${locale}/${localedCategory[locale].ring}/${index + 1}`,
      lastModified: new Date().toISOString(),
    }))
  ).flat();

  const dynamicNecklaceCategoryRoutes = Array.from({ length: necklacePages }, (_, index) =>
    locales.flatMap((locale) => ({
      url: `${baseUrl}/${locale}/${localedCategory[locale].necklace}/${index + 1}`,
      lastModified: new Date().toISOString(),
    }))
  ).flat();

  const dynamicEarringCategoryRoutes = Array.from({ length: earringPages }, (_, index) =>
    locales.flatMap((locale) => ({
      url: `${baseUrl}/${locale}/${localedCategory[locale].earring}/${index + 1}`,
      lastModified: new Date().toISOString(),
    }))
  ).flat();


  const dynamicBracerCategoryRoutes = Array.from({ length: bracerPages }, (_, index) =>
    locales.flatMap((locale) => ({
      url: `${baseUrl}/${locale}/${localedCategory[locale].bracer}/${index + 1}`,
      lastModified: new Date().toISOString(),
    }))
  ).flat();

  // For dynamic product routes, map each product per locale
  const dynamicRingRoutes = ringProducts.flatMap((ring) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/${localedCategoryItem[locale].ring}/${ring.code}`,
      lastModified: new Date().toISOString(),
    }))
  );

  const dynamicNecklaceRoutes = necklaceProducts.flatMap((necklace) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/${localedCategoryItem[locale].necklace}/${necklace.code}`,
      lastModified: new Date().toISOString(),
    }))
  );

  const dynamicEarringRoutes = earringProducts.flatMap((earring) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/${localedCategoryItem[locale].earring}/${earring.code}`,
      lastModified: new Date().toISOString(),
    }))
  );

  const dynamicBracerRoutes = bracerProducts.flatMap((bracer) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/${localedCategoryItem[locale].bracer}/${bracer.code}`,
      lastModified: new Date().toISOString(),
    }))
  );

  // Combine them all into a single array
  const routes = [
    ...localizedStaticRoutes,
    // Category pages
    ...dynamicRingCategoryRoutes,
    ...dynamicNecklaceCategoryRoutes,
    ...dynamicEarringCategoryRoutes,
    ...dynamicBracerCategoryRoutes,
    // Products
    ...dynamicRingRoutes,
    ...dynamicNecklaceRoutes,
    ...dynamicEarringRoutes,
    ...dynamicBracerRoutes,
    // Blog posts
    ...dynamicBlogPostsRU,
    ...dynamicBlogPostsUK
  ];

  return routes;
}
