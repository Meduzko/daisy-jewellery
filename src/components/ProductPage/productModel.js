// Catalog product → product page view model (plain, serializable data for the
// client components). Everything shown comes from the product record, its
// variants, sizes and family; only labels and units come from copy.js.

import { decode } from 'html-entities';
import { getDisplayPrices } from '../../helpers/productPricing';
import { getProductLink } from '../../helpers/getProductLink';
import { getVariantFacet } from '../../helpers/productFamily';
import { isProductAvailable } from '../../helpers/productAvailability';
import { toCartItem } from '../Category/cardModel';
import { QUICK, getCategoryConfig, getCategoryUrls } from '../Category/config';
import { getProductCopy } from './copy';
import { formatSize } from './sizeFormat';

// Quick links of the category config that name a motif collection (not a material).
const COLLECTION_LINKS = [QUICK.clover, QUICK.hearts, QUICK.bismarck];

const STONE_SPECS = [
  { re: /перламутр/i, uk: 'перламутр', ru: 'перламутр' },
  { re: /сердолік|сердолик/i, uk: 'сердолік', ru: 'сердолик' },
  { re: /нефрит/i, uk: 'нефрит', ru: 'нефрит' },
  { re: /малахіт|малахит/i, uk: 'малахіт', ru: 'малахит' },
  { re: /онікс|оникс/i, uk: 'онікс', ru: 'оникс' },
  { re: /емал|эмал/i, uk: 'емаль', ru: 'эмаль' },
  { re: /цирконі|цирконий/i, uk: 'кубічний цирконій', ru: 'кубический цирконий' },
  { re: /фіаніт|фианит|камінц|камешк/i, uk: 'фіаніти', ru: 'фианиты' },
];

const RHODIUM_RE = /родов|родійов|роді[йюя]|родир|родий|родиров/i;
const GILDED_RE = /позолот/i;

export const stripHtml = (html) =>
  decode(String(html || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

/** HTML from the CMS → plain paragraphs (no markup is rendered). */
export function toParagraphs(html) {
  return String(html || '')
    .split(/<\/p>|<br\s*\/?>|\n{2,}/i)
    .map(stripHtml)
    .filter(Boolean);
}

const formatNumber = (n, lang) =>
  Number(n).toLocaleString(lang === 'ru' ? 'ru-UA' : 'uk-UA', { maximumFractionDigits: 2 });


function getCollection(title, config, lang, baseURL) {
  const text = String(title || '').toLowerCase();
  const link = COLLECTION_LINKS.find((l) => l && text.includes(l.q));
  if (!link || !config) return null;
  return { name: link[lang], stem: link.q, href: `${baseURL}?q=${encodeURIComponent(link.q)}` };
}

function getStones(title, lang) {
  const found = STONE_SPECS.filter((s) => s.re.test(title)).map((s) => s[lang]);
  const list = [...new Set(found)];
  if (!list.length) return null;
  const text = list.join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Values of a catalog attribute (product.attributes from PostgreSQL), or [] (DNTrade mode / no data). */
function attributeValues(product, code) {
  const a = (product.attributes || []).find((x) => x.code === code);
  return (a?.values || []).map((v) => v.value).filter(Boolean);
}
const joinCapitalized = (list) => {
  const text = list.map((v, i) => (i ? v.charAt(0).toLowerCase() + v.slice(1) : v)).join(', ');
  return text || null;
};
// «Без вставок» is a spec value, not something to name in the descriptor line.
const NO_INSERT_RE = /^без вставок$/i;

function getWeight(variants, lang, unit) {
  const weights = (variants || []).map((v) => v.weight_g).filter((w) => Number(w) > 0).map(Number);
  if (!weights.length) return null;
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  return min === max
    ? `${formatNumber(min, lang)} ${unit}`
    : `${formatNumber(min, lang)}–${formatNumber(max, lang)} ${unit}`;
}

/**
 * @param {object} product   storefront product (catalog mapper / DNTrade shape)
 * @param {{ lang: 'uk'|'ru', category: string, sizes?: number[], t?: {title?: string, description?: string},
 *   family?: { variants: object[] } }} options
 */
export function toProductModel(product, { lang, category, sizes = [], t, family }) {
  const copy = getProductCopy(lang);
  const config = getCategoryConfig(category);
  const { baseURL } = config ? getCategoryUrls(config, lang) : { baseURL: `/${lang}` };

  const title = String(t?.title || product.title || '').trim();
  const sourceText = `${title} ${product.title || ''}`;
  const display = getDisplayPrices(product);
  const price = Number(display.price);
  const priceKnown = Number.isFinite(price) && price > 0;
  const images = (product.images?.length ? product.images : [product.image_path]).filter(Boolean);
  const collection = getCollection(sourceText, config, lang, baseURL);

  // ---- variant swatches: this card + same-model cards of the category
  const facet = getVariantFacet(sourceText, lang);
  let swatches = [];
  const siblings = family?.variants || [];
  if (siblings.length) {
    const seen = new Set([facet.label]);
    swatches = [
      { href: getProductLink({ ...product, category }, lang), label: facet.label, swatch: facet.swatch, gilded: facet.gilded, byStone: facet.byStone, image: images[0] || null, current: true, code: String(product.code) },
    ];
    for (const sibling of siblings) {
      const f = getVariantFacet(sibling.title, lang);
      if (seen.has(f.label)) continue;
      seen.add(f.label);
      const siblingImages = (sibling.images?.length ? sibling.images : [sibling.image_path]).filter(Boolean);
      swatches.push({
        href: getProductLink({ ...sibling, category }, lang),
        label: f.label,
        swatch: f.swatch,
        gilded: f.gilded,
        byStone: f.byStone,
        image: siblingImages[0] || null,
        current: false,
        code: String(sibling.code),
        price: Number(getDisplayPrices(sibling).price) || null,
      });
    }
    // stable order (by code, as in the catalog) so swatches don't jump between pages
    swatches.sort((a, b) => (Number(a.code) || 0) - (Number(b.code) || 0));
    if (swatches.length < 2) swatches = [];
  }
  const swatchesByStone = swatches.length > 0 && swatches.every((s) => s.byStone);

  // ---- description
  const override = stripHtml(t?.description);
  const shortParas = toParagraphs(product.short_description);
  const longParas = toParagraphs(product.description);
  let description = override ? [override] : [...shortParas];
  if (!override) {
    const shortText = shortParas.join(' ');
    for (const p of longParas) if (!shortText.includes(p)) description.push(p);
  }
  description = description.filter(Boolean);

  // ---- specifications (only rows with data)
  const sizeList = [...new Set((sizes || []).map(Number).filter(Number.isFinite))].sort((a, b) => a - b);
  // Catalog attributes (owner's spec sheets) win; the title-based guesses remain the
  // fallback for products without attribute data (and for the DNTrade rollback mode).
  const metals = attributeValues(product, 'metal');
  const inserts = attributeValues(product, 'insertion');
  const insertColors = attributeValues(product, 'insertion_color');
  const coatings = attributeValues(product, 'coating');
  const clasps = attributeValues(product, 'clasp');

  const specs = [{
    label: copy.spec.metal,
    value: metals.length ? `${metals.join(', ')}` : copy.spec.metalValue,
  }];
  const stones = inserts.length ? joinCapitalized(inserts) : getStones(sourceText, lang);
  if (stones) specs.push({ label: copy.spec.insert, value: stones });
  if (insertColors.length) specs.push({ label: copy.spec.insertColor, value: joinCapitalized(insertColors) });
  const plating = coatings.length
    ? joinCapitalized(coatings)
    : GILDED_RE.test(sourceText)
      ? copy.platingGilded
      : RHODIUM_RE.test(`${sourceText} ${product.sku || ''}`) ? (lang === 'ru' ? 'Родий' : 'Родій') : null;
  if (plating) specs.push({ label: copy.spec.plating, value: plating });
  if (clasps.length) specs.push({ label: copy.spec.clasp, value: joinCapitalized(clasps) });
  if (collection) specs.push({ label: copy.spec.collection, value: collection.name });
  if (sizeList.length) {
    specs.push({
      label: copy.spec.sizes,
      value: sizeList.length > 1 ? `${formatSize(sizeList[0])} – ${formatSize(sizeList[sizeList.length - 1])}` : formatSize(sizeList[0]),
    });
  } else {
    // bracelets / necklaces: the size label is the (adjustable) length, e.g. «17–19 см»
    const lengths = (product.variants || []).map((v) => v.size_label).filter(Boolean);
    if (lengths.length) {
      specs.push({ label: category === 'ring' ? copy.spec.sizes : copy.spec.length, value: [...new Set(lengths)].join(', ') });
    }
  }
  if (Number(product.avg_weight_g) > 0) {
    specs.push({ label: copy.spec.avgWeight, value: `${formatNumber(product.avg_weight_g, lang)} ${copy.spec.grams}` });
  } else {
    const weight = getWeight(product.variants, lang, copy.spec.grams);
    if (weight) specs.push({ label: copy.spec.weight, value: weight });
  }
  const articleParts = [product.sku, product.code != null ? `${copy.code.toLowerCase()} ${product.code}` : null].filter(Boolean);
  if (articleParts.length) specs.push({ label: copy.spec.article, value: articleParts.join(' · ') });

  return {
    code: String(product.code),
    sku: product.sku || '',
    title,
    descriptor: [
      copy.silver,
      (inserts.length ? joinCapitalized(inserts.filter((v) => !NO_INSERT_RE.test(v))) : stones)?.toLowerCase(),
      (coatings.length ? coatings.some((c) => GILDED_RE.test(c)) : GILDED_RE.test(sourceText)) ? copy.platingGilded.toLowerCase() : null,
    ]
      .filter(Boolean)
      .join(', '),
    images,
    price: priceKnown ? price : null,
    originalPrice: display.hasDiscount ? Number(display.originalPrice) : null,
    hasDiscount: Boolean(display.hasDiscount && priceKnown),
    available: isProductAvailable(product) && priceKnown,
    soldOut: !isProductAvailable(product),
    priceKnown,
    category,
    categoryName: config?.name?.[lang] || '',
    categoryHref: baseURL,
    collection,
    sizes: sizeList,
    sizeGuideHref: config?.sizeGuideHref ? config.sizeGuideHref(lang) : null,
    swatches,
    swatchKind: swatchesByStone ? 'insert' : 'variant',
    currentLabel: facet.label,
    description,
    specs,
    cartItem: toCartItem({ ...product, title }),
  };
}
