/**
 * Availability of a storefront product. PostgreSQL products carry variants
 * (stock NULL = not tracked = available): a product is out of stock only when
 * every variant is tracked and sold out. DNTrade products have no stock data
 * and stay available, as before.
 */
export function isProductAvailable(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : null;
  if (!variants || !variants.length) return true;
  return variants.some((v) => v.in_stock !== false);
}
