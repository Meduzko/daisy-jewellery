import { getCachedProductByCode, getCachedListing } from './dataCache';
import { CATEGORY_KEYS } from './catalog/categories';
import { getItemTranslations } from '../dictionaries';
import { getProductLink } from '../helpers/getProductLink';
import { getDisplayPrices } from '../helpers/productPricing';
import { translations as sliderTranslations } from '../components/ProductItem/translations';

// CMS dictionary keys (ru.json → products.<key>) per product category.
const DICTIONARY_CATEGORY = {
  ring: 'koltsa',
  earring: 'sergi',
  necklace: 'kolye',
  bracer: 'braslety',
};

/**
 * Loads a curated list of CMS products ({ category, code }) through the shared
 * product cache and maps them to the lightweight shape the homepage cards need.
 * Products that are missing / unpublished in the CMS are skipped.
 */
export async function getHomeProducts(list = [], lang = 'uk') {
  const products = await Promise.all(
    list.map(async ({ category, code }) => {
      if (!CATEGORY_KEYS.includes(category)) return null;

      try {
        const product = await getCachedProductByCode(category, code, lang);
        if (!product) return null;

        return await toHomeCard({ ...product, category }, lang);
      } catch {
        return null;
      }
    })
  );

  return products.filter(Boolean);
}

/**
 * Products of the given collections (collections.code, e.g. 'new', 'popular'),
 * deduplicated, as homepage cards. Each card keeps its `collections` codes so
 * the grid can filter by them.
 */
export async function getHomeCollectionProducts(collections = [], lang = 'uk', limit = 8) {
  const lists = await Promise.all(
    collections.map((collection) =>
      getCachedListing({ limit, locale: lang, filters: { collection } })
        .then((r) => r.products)
        .catch(() => [])
    )
  );
  const unique = [...new Map(lists.flat().map((p) => [p.product_id ?? p.code, p])).values()];
  return Promise.all(unique.map((product) => toHomeCard(product, lang)));
}

async function toHomeCard(item, lang) {
  let title = item.title;

  if (lang === 'ru' && DICTIONARY_CATEGORY[item.category]) {
    const tk = await getItemTranslations({
      lang,
      categoryName: DICTIONARY_CATEGORY[item.category],
      code: item.code,
    }).catch(() => undefined);
    title = tk?.title || sliderTranslations?.ru?.[item.code]?.title || title;
  }

  const { price, originalPrice, hasDiscount } = getDisplayPrices(item);

  return {
    id: item.product_id ?? `${item.category}-${item.code}`,
    code: item.code,
    category: item.category,
    collections: item.collections || [],
    title: (title || '').trim(),
    image: item.image_path || item.images?.[0] || null,
    href: getProductLink(item, lang),
    price,
    originalPrice,
    hasDiscount,
  };
}
