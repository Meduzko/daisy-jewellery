// Storefront category keys ↔ PostgreSQL `categories.code`, and helpers over the category list
// (repository.listCategories → src/lib/dataCache.js getCachedCategories).
// The four original categories keep their historic storefront keys (ring, earring, necklace,
// bracer: used in dictionaries, carts, ?cat=…); any other category's key is its DB code.
// The DB forbids those four keys as codes (migration 20261119000001), so the mapping is 1:1.

export const CATEGORY_KEYS = ['ring', 'earring', 'necklace', 'bracer'];

export const CATEGORY_DB_CODE = {
  ring: 'rings',
  earring: 'earrings',
  necklace: 'necklaces',
  bracer: 'bracelets',
};

export const CATEGORY_KEY_BY_DB_CODE = Object.fromEntries(
  Object.entries(CATEGORY_DB_CODE).map(([key, code]) => [code, key])
);

/** Accepts a storefront key ('ring') or a DB code ('rings'); returns the storefront key or null. */
export function toCategoryKey(value) {
  if (!value) return null;
  return CATEGORY_KEY_BY_DB_CODE[value] || String(value);
}

export function toCategoryDbCode(value) {
  if (!value) return null;
  return CATEGORY_DB_CODE[value] || String(value);
}

const LANGS = ['uk', 'ru'];
const otherLang = (lang) => (lang === 'ru' ? 'uk' : 'ru');

/** Site path of a category listing per locale ('uk/kabluchki'); ru = null without a Russian text. */
export function categoryPaths(category) {
  return {
    uk: `uk/${category.uk.slug}`,
    ru: category.ru.isFallback ? null : `ru/${category.ru.slug}`,
  };
}

export const categoryHref = (category, lang) => `/${lang}/${category[lang].slug}`;

/**
 * The category of a URL: `path` is a listing slug ('kabluchki') or a product URL prefix
 * ('kabluchki/kupyty-sribnu-kabluchku'). A match in the other locale's URLs returns
 * `redirect: true` (the page then 301s to this locale's URL); no match → null.
 * @returns {{ category: object, redirect: boolean } | null}
 */
export function resolveCategoryPath(categories, lang, path) {
  const field = path.includes('/') ? 'urlPrefix' : 'slug';
  const own = categories.find((c) => c[lang][field] === path);
  if (own) return { category: own, redirect: false };
  const other = categories.find((c) => c[otherLang(lang)][field] === path);
  return other ? { category: other, redirect: true } : null;
}

export const findCategoryByKey = (categories, key) => categories.find((c) => c.key === key) || null;

/** Header / footer / mobile menu links. Empty categories (404 page) are left out. */
export const navigationItems = (categories, lang) =>
  categories
    .filter((c) => c.showInNavigation && c.productCount > 0)
    .map((c) => ({ title: c[lang].name, link: categoryHref(c, lang) }));

/** Static params of the listing route: every published category in both locales. */
export const categoryStaticParams = (categories) =>
  categories.flatMap((c) => LANGS.map((lang) => ({ lang, category: c[lang].slug })));

/** seo_bottom_text: the first paragraph is shown, the rest is collapsed («Читати далі»). */
export function splitSeoText(text) {
  const [lead, ...more] = String(text || '').trim().split(/\n\s*\n/);
  return { lead: lead || '', more: more.join('\n\n') || null };
}
