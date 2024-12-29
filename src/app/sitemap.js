import { fetchProduct } from '../actions/fetchProduct';

export default async function sitemap() {
  const baseUrl = process.env.SITE_DOMAIN;
  const ringProducts = await fetchProduct({
    categoryId: process.env.RING_CATEGORY_ID,
    limit: 100,
  });
  const necklaceProducts = await fetchProduct({
    categoryId: process.env.NECKLACE_CATEGORY_ID,
    limit: 100,
  });
  const earringProducts = await fetchProduct({
    categoryId: process.env.EARING_CATEGORY_ID,
    limit: 100,
  });
  const bracerProducts = await fetchProduct({
    categoryId: process.env.BRACER_CATEGORY_ID,
    limit: 100,
  });

  const categories = ['kabluchki', 'serezhky', 'kolye', 'braslety'];
  const staticRoutes = ['', 'about', 'contact', ...categories];

  const dynamicRingRoutes = ringProducts.map((ring) => ({
    url: `${baseUrl}/kabluchki/kupyty-sribnu-kabluchku/${ring.code}`,
    lastModified: new Date().toISOString(),
  }));

  const dynamicNecklaceRoutes = necklaceProducts.map((necklace) => ({
    url: `${baseUrl}/serezhky/kupyty-serezhky-sribni/${necklace.code}`,
    lastModified: new Date().toISOString(),
  }));

  const dynamicEarringRoutes = earringProducts.map((earring) => ({
    url: `${baseUrl}/kolye/kupyty-sribne-kolye/${earring.code}`,
    lastModified: new Date().toISOString(),
  }));

  const dynamicBracerRoutes = bracerProducts.map((bracer) => ({
    url: `${baseUrl}/braslety/kupyty-sribnyy-braslet/${bracer.code}`,
    lastModified: new Date().toISOString(),
  }));

  const routes = [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}/${route}`,
      lastModified: new Date().toISOString(),
    })),
    ...dynamicRingRoutes,
    ...dynamicNecklaceRoutes,
    ...dynamicEarringRoutes,
    ...dynamicBracerRoutes,
  ];

  return routes;
}
