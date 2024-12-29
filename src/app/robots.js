export default function robots() {
  const baseUrl = process.env.SITE_DOMAIN;
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
