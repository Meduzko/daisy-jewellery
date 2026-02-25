export default function robots() {
  const baseUrl = process.env.SITE_DOMAIN || process.env.NEXT_PUBLIC_BASE_URL || 'https://daisy-jewellery.com.ua';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/order',
          '/*?*utm_',
          '/*?*gclid',
          '/*?*fbclid',
          '/*?*msclkid',
          '/*?*sort=',
          '/*?*filter=',
          '/*?*ref=',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}