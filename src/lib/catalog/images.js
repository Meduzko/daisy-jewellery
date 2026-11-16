// Product image URL: the R2 copy when PRODUCT_IMAGE_SOURCE=r2 and the row has a verified r2_key
// (scripts/map-r2-images.js), otherwise the stored DNTrade URL — also the rollback path.
// Photos uploaded in Directus exist only in R2 (url is NULL), so they use R2 whatever the flag says.

/** @param {string|null} url DNTrade URL (product_images.url) @param {string|null} [r2Key] product_images.r2_key */
export function productImageUrl(url, r2Key) {
  const base = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
  if (!r2Key || !base || (url && process.env.PRODUCT_IMAGE_SOURCE !== 'r2')) return url;
  return `${base.replace(/\/+$/, '')}/${r2Key.split('/').map(encodeURIComponent).join('/')}`;
}
