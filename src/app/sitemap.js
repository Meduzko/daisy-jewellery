import { fetchProduct } from '../actions/fetchProduct';
import { getAllHtmlPosts } from '../lib/posts';

export default async function sitemap() {
  const baseUrl = process.env.SITE_DOMAIN;
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

  const ringProducts = await fetchProduct({
    categoryId: process.env.RING_CATEGORY_ID, 
    limit: 100
  });
  const necklaceProducts = await fetchProduct({
    categoryId: process.env.NECKLACE_CATEGORY_ID, 
    limit: 100
  });
  const earringProducts = await fetchProduct({
    categoryId: process.env.EARING_CATEGORY_ID, 
    limit: 100
  });
  const bracerProducts = await fetchProduct({
    categoryId: process.env.BRACER_CATEGORY_ID, 
    limit: 100
  });

  const ringPages = 4;
  const necklacePages = 3;
  const earringPages = 3;
  const bracerPages = 2;

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
