import { getCachedProductByCode } from './dataCache';
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

        const item = { ...product, category };
        let title = product.title;

        if (lang === 'ru') {
          const tk = await getItemTranslations({
            lang,
            categoryName: DICTIONARY_CATEGORY[category],
            code: product.code,
          }).catch(() => undefined);
          title = tk?.title || sliderTranslations?.ru?.[product.code]?.title || title;
        }

        const { price, originalPrice, hasDiscount } = getDisplayPrices(item);

        return {
          id: product.product_id ?? `${category}-${code}`,
          code: product.code,
          category,
          title: (title || '').trim(),
          image: product.image_path || product.images?.[0] || null,
          href: getProductLink(item, lang),
          price,
          originalPrice,
          hasDiscount,
        };
      } catch {
        return null;
      }
    })
  );

  return products.filter(Boolean);
}
