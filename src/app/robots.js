import { getSiteUrl } from '../helpers/seo';

// Checkout (/{lang}/order) and search (/{lang}/search) stay crawlable on purpose:
// they carry a `noindex` robots meta tag, which crawlers only see if they may fetch the page.
export default function robots() {
  const baseUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
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
  };
}
