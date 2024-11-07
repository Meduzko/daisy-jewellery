import { fetchProduct } from '../actions/fetchProduct';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const ringProducts = await fetchProduct({ categoryId: process.env.RING_CATEGORY_ID, limit: 100 });
  const necklaceProducts = await fetchProduct({ categoryId: process.env.NECKLACE_CATEGORY_ID, limit: 100 });
  const earringProducts = await fetchProduct({ categoryId: process.env.EARING_CATEGORY_ID, limit: 100 });
  const bracerProducts = await fetchProduct({ categoryId: process.env.BRACER_CATEGORY_ID, limit: 100 });

  const categories = ['/category/ring/page/1', '/category/earring/page/1', '/category/necklace/page/1', '/category/bracer/page/1'];
  const staticRoutes = ['', 'about', 'contact', ...categories];

  const dynamicRingRoutes = ringProducts.map((ring) => ({
    url: `${baseUrl}/category/ring/${ring.code}`,
    lastModified: new Date().toISOString(),
  }));

  const dynamicNecklaceRoutes = necklaceProducts.map((necklace) => ({
    url: `${baseUrl}/category/necklace/${necklace.code}`,
    lastModified: new Date().toISOString(),
  }));

  const dynamicEarringRoutes = earringProducts.map((earring) => ({
    url: `${baseUrl}/category/earring/${earring.code}`,
    lastModified: new Date().toISOString(),
  }));

  const dynamicBracerRoutes = bracerProducts.map((bracer) => ({
    url: `${baseUrl}/category/bracer/${bracer.code}`,
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
    ...dynamicBracerRoutes
  ];

  return routes;
}
