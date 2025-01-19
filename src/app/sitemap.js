import { fetchProduct } from '../actions/fetchProduct';

export default async function sitemap() {
  const baseUrl = process.env.SITE_DOMAIN;
  const locales = ['uk', 'ru'];
  const localedCategory = {
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

  // These are your "base" routes for each locale
  const categories = ['kabluchki', 'serezhky', 'kolye', 'braslety', 'koltsa', 'sergi', ];
  const staticRoutes = ['', 'about', 'contact', ...categories];

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

  // For dynamic product routes, map each product per locale
  const dynamicRingRoutes = ringProducts.flatMap((ring) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/${localedCategory[locale].ring}/${ring.code}`,
      lastModified: new Date().toISOString(),
    }))
  );

  const dynamicNecklaceRoutes = necklaceProducts.flatMap((necklace) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/${localedCategory[locale].necklace}/${necklace.code}`,
      lastModified: new Date().toISOString(),
    }))
  );

  const dynamicEarringRoutes = earringProducts.flatMap((earring) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/${localedCategory[locale].earring}/${earring.code}`,
      lastModified: new Date().toISOString(),
    }))
  );

  const dynamicBracerRoutes = bracerProducts.flatMap((bracer) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/${localedCategory[locale].bracer}/${bracer.code}`,
      lastModified: new Date().toISOString(),
    }))
  );

  // Combine them all into a single array
  const routes = [
    ...localizedStaticRoutes,
    ...dynamicRingRoutes,
    ...dynamicNecklaceRoutes,
    ...dynamicEarringRoutes,
    ...dynamicBracerRoutes,
  ];

  return routes;
}
