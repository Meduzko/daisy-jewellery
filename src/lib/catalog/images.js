// Product image URL: every photo is served from Cloudflare R2 (product_images.r2_key,
// filled by scripts/map-r2-images.js or the Directus upload trigger).

/** @param {string|null} r2Key product_images.r2_key */
export function productImageUrl(r2Key) {
  const base = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;
  if (!r2Key || !base) return null;
  return `${base.replace(/\/+$/, '')}/${r2Key.split('/').map(encodeURIComponent).join('/')}`;
}
