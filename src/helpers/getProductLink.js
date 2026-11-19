/**
 * Product page URL: /{lang}/{category URL prefix}/{code}. The prefix comes from the product's
 * category in PostgreSQL (`category_paths`, set by src/lib/catalog/mapper.js), so it follows
 * category slugs edited in Directus. Without it (e.g. an old cart item) → the home page.
 */
export const getProductLink = (product, lang) => {
  const locale = lang === 'ru' ? 'ru' : 'uk';
  const prefix = product?.category_paths?.[locale];
  if (!prefix || product.code == null) return `/${locale}`;
  return `/${locale}/${prefix}/${product.code}`;
};
