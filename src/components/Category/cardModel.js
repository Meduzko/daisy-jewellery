// Catalog product → category card view model (plain, serializable data).
// Used by the server page and by GET /api/catalog/products so cards rendered
// on the server and cards appended by «Показати ще» / filters are identical.

import { getProductLink } from '../../helpers/getProductLink';
import { getDisplayPrices } from '../../helpers/productPricing';
import { getCategoryCopy } from './copy';

const stripHtml = (html) =>
  String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Materials / stones named in the product title → descriptor line under the name.
// Only what the title states is shown; nothing is inferred beyond it.
const FEATURES = [
  { re: /фіаніт|фианит|цирконі|циркон|цирконий/i, uk: 'фіаніти', ru: 'фианиты' },
  { re: /перламутр/i, uk: 'перламутр', ru: 'перламутр' },
  { re: /онікс|оникс/i, uk: 'онікс', ru: 'оникс' },
  { re: /малахіт|малахит/i, uk: 'малахіт', ru: 'малахит' },
  { re: /нефрит/i, uk: 'нефрит', ru: 'нефрит' },
  { re: /емал|эмал/i, uk: 'емаль', ru: 'эмаль' },
  { re: /позолот/i, uk: 'позолота', ru: 'позолота' },
  { re: /роді|роди/i, uk: 'родій', ru: 'родий' },
  { re: /золот[аоуі]?\s*375|375\s*проб/i, uk: 'золото 375°', ru: 'золото 375°' },
];

export function getDescriptor(title, lang) {
  const parts = [lang === 'ru' ? 'Серебро 925°' : 'Срібло 925°'];
  for (const f of FEATURES) {
    const value = f[lang === 'ru' ? 'ru' : 'uk'];
    if (f.re.test(title) && !parts.includes(value)) parts.push(value);
  }
  return parts.join(', ');
}

/** Card badges (design: «Хіт продажів», «Новинка», «−N%»). */
function getBadges(product, display, lang) {
  const copy = getCategoryCopy(lang);
  const badges = [];
  const saleBadge = display.badges.find((b) => b.type === 'sale');
  if (display.hasDiscount) {
    const original = Number(display.originalPrice);
    const percent = saleBadge?.value
      ? Number(String(saleBadge.value).replace(',', '.'))
      : original > 0 ? Math.round(((original - Number(display.price)) / original) * 100) : null;
    if (percent) badges.push({ type: 'sale', label: `−${Math.round(percent)}%` });
  }
  const tagTitles = (product.tags || []).flatMap((t) => t.items || []).map((i) => String(i.title || '').toLowerCase());
  const collections = product.collections || [];
  if (display.badges.some((b) => b.type === 'popular') || collections.includes('popular')) {
    badges.push({ type: 'popular', label: copy.badges.popular });
  }
  if (collections.includes('new') || tagTitles.includes('новинка')) {
    badges.push({ type: 'new', label: copy.badges.new });
  }
  return badges.slice(0, 1); // one badge per tile, as in the design
}

/**
 * Product as stored in the cart (CartContext → Cart, OrderList, order upload).
 * Only the long description HTML and SEO texts are dropped; `images` must stay:
 * the cart and the order form render `item.images[0]`.
 */
export function toCartItem(product) {
  const { description, seo_title, seo_description, ...rest } = product;
  const images = (product.images?.length ? product.images : [product.image_path]).filter(Boolean);
  return { ...rest, images };
}

/**
 * @param {object} product  storefront product (src/lib/catalog/mapper.js shape or DNTrade)
 * @param {{ lang: 'uk'|'ru', translations?: Record<string, {title?: string}>, itemBaseURL?: string }} options
 */
export function toCardModel(product, { lang, translations, itemBaseURL } = {}) {
  const override = translations?.[String(product.code)];
  const title = String(override?.title || product.title || '').trim();
  const display = getDisplayPrices(product);
  const href = product.category && lang ? getProductLink(product, lang) : `${itemBaseURL}/${product.code}`;
  const images = (product.images?.length ? product.images : [product.image_path]).filter(Boolean);

  return {
    id: String(product.id ?? product.product_id ?? product.code),
    code: String(product.code),
    sku: product.sku || '',
    href,
    name: title,
    descriptor: getDescriptor(`${title} ${product.title || ''} ${stripHtml(product.short_description)}`, lang),
    image: images[0] || null,
    image2: images[1] || null,
    price: display.price,
    originalPrice: display.originalPrice,
    hasDiscount: display.hasDiscount,
    badges: getBadges(product, display, lang),
    item: toCartItem({ ...product, title }),
  };
}
