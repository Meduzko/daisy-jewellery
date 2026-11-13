/**
 * SEO Helper Utilities
 * Provides consistent URL building and metadata generation for SEO
 */

const SITE_URL = process.env.SITE_DOMAIN || process.env.NEXT_PUBLIC_BASE_URL || 'https://daisy-jewellery.com.ua';
const SUPPORTED_LOCALES = ['uk', 'ru'];
const DEFAULT_LOCALE = 'uk';

/**
 * Tracking parameters that should be stripped or ignored for canonical URLs
 */
export const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium', 
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'msclkid',
  'ref',
];

/**
 * Filter/sort parameters that indicate non-canonical URL variants
 */
export const FACET_PARAMS = [
  'sort',
  'order',
  'filter',
  'page',
  'size',
  'color',
  'material',
  'price_from',
  'price_to',
];

/**
 * Build an absolute canonical URL
 * @param {string} path - Path without leading slash (e.g., 'uk/kabluchki')
 * @returns {string} Absolute URL
 */
export function buildCanonicalUrl(path) {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${SITE_URL}/${cleanPath}`;
}

/**
 * Build canonical URL for a specific locale
 * @param {string} lang - Locale code ('uk' or 'ru')
 * @param {string} path - Path without locale prefix (e.g., 'kabluchki')
 * @returns {string} Absolute URL with locale
 */
export function buildLocalizedCanonicalUrl(lang, path = '') {
  const locale = SUPPORTED_LOCALES.includes(lang) ? lang : DEFAULT_LOCALE;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return cleanPath ? `${SITE_URL}/${locale}/${cleanPath}` : `${SITE_URL}/${locale}`;
}

/**
 * Generate hreflang alternates for a page
 * @param {object} paths - Object with locale keys and path values
 * @returns {object} Hreflang alternates object for Next.js metadata
 */
export function buildHreflangAlternates(paths) {
  return {
    'uk-UA': paths.uk ? buildCanonicalUrl(paths.uk) : null,
    'ru-UA': paths.ru ? buildCanonicalUrl(paths.ru) : null,
  };
}

/**
 * Check if URL has tracking parameters
 * @param {URLSearchParams} searchParams 
 * @returns {boolean}
 */
export function hasTrackingParams(searchParams) {
  return TRACKING_PARAMS.some(param => searchParams.has(param));
}

/**
 * Check if URL has facet/filter parameters
 * @param {URLSearchParams} searchParams 
 * @returns {boolean}
 */
export function hasFacetParams(searchParams) {
  return FACET_PARAMS.some(param => searchParams.has(param));
}

/**
 * Strip tracking parameters from URL
 * @param {URL} url 
 * @returns {URL} Clean URL without tracking params
 */
export function stripTrackingParams(url) {
  const cleanUrl = new URL(url);
  TRACKING_PARAMS.forEach(param => cleanUrl.searchParams.delete(param));
  return cleanUrl;
}

/**
 * Get the base URL without any query parameters (for canonical)
 * @param {URL} url 
 * @returns {string} Base URL path
 */
export function getBaseUrlPath(url) {
  return url.pathname;
}

/**
 * Generate robots meta tag value based on URL characteristics
 * @param {object} options
 * @param {boolean} options.hasTrackingParams - URL has tracking params
 * @param {boolean} options.hasFacetParams - URL has filter/sort params
 * @param {boolean} options.isIndexable - Page should be indexable
 * @returns {object} Robots meta object
 */
export function getRobotsConfig({ hasTrackingParams = false, hasFacetParams = false, isIndexable = true }) {
  if (hasFacetParams) {
    return {
      index: false,
      follow: true,
      nocache: true,
    };
  }
  
  if (!isIndexable) {
    return {
      index: false,
      follow: false,
    };
  }
  
  return {
    index: true,
    follow: true,
    nocache: true,
  };
}

/**
 * Category slug mappings between locales
 */
export const CATEGORY_SLUGS = {
  uk: {
    ring: 'kabluchki',
    earring: 'serezhky',
    necklace: 'kolye',
    bracer: 'braslety',
  },
  ru: {
    ring: 'koltsa',
    earring: 'sergi',
    necklace: 'kolye',
    bracer: 'braslety',
  }
};

/**
 * Product URL slugs (category + subcategory) by locale
 * Supports both category types (ring, earring) and URL slugs (kabluchki, serezhky)
 */
export const PRODUCT_URL_SLUGS = {
  uk: {
    ring: 'kabluchki/kupyty-sribnu-kabluchku',
    earring: 'serezhky/kupyty-serezhky-sribni',
    necklace: 'kolye/kupyty-sribne-kolye',
    bracer: 'braslety/kupyty-sribnyy-braslet',
    // Also support URL slugs as keys
    kabluchki: 'kabluchki/kupyty-sribnu-kabluchku',
    serezhky: 'serezhky/kupyty-serezhky-sribni',
    kolye: 'kolye/kupyty-sribne-kolye',
    braslety: 'braslety/kupyty-sribnyy-braslet',
  },
  ru: {
    ring: 'koltsa/kupit-serebryanoye-koltso',
    earring: 'sergi/kupit-serebryanyye-sergi',
    necklace: 'kolye/kupit-serebryanoye-kolye',
    bracer: 'braslety/kupit-serebryanyy-braslet',
    // Also support URL slugs as keys
    koltsa: 'koltsa/kupit-serebryanoye-koltso',
    sergi: 'sergi/kupit-serebryanyye-sergi',
    kolye: 'kolye/kupit-serebryanoye-kolye',
    braslety: 'braslety/kupit-serebryanyy-braslet',
  }
};

/**
 * Map category type to both locale URL slugs for hreflang
 * @param {string} categoryType - Category type (ring, earring, necklace, bracer)
 * @param {string} productCode - Product code
 * @returns {object} Object with uk and ru full paths
 */
export function getProductHreflangPaths(categoryType, productCode) {
  return {
    uk: `uk/${PRODUCT_URL_SLUGS.uk[categoryType]}/${productCode}`,
    ru: `ru/${PRODUCT_URL_SLUGS.ru[categoryType]}/${productCode}`,
  };
}

/**
 * Map category slug to category type
 */
export const SLUG_TO_CATEGORY_TYPE = {
  kabluchki: 'ring',
  koltsa: 'ring',
  serezhky: 'earring',
  sergi: 'earring',
  kolye: 'necklace',
  braslety: 'bracer',
};

/**
 * Get category hreflang paths
 * @param {string} categoryType - Category type (ring, earring, necklace, bracer)
 * @param {number} pageNumber - Page number
 * @returns {object} Object with uk and ru full paths
 */
export function getCategoryHreflangPaths(categoryType, pageNumber) {
  return {
    uk: `uk/${CATEGORY_SLUGS.uk[categoryType]}/${pageNumber}`,
    ru: `ru/${CATEGORY_SLUGS.ru[categoryType]}/${pageNumber}`,
  };
}

/**
 * Get site URL constant
 * @returns {string}
 */
export function getSiteUrl() {
  return SITE_URL;
}

// URL segments that differ between locales: [uk, ru]. Category, product-path and
// blog-post slugs (src/content/{uk,ru}/<slug>.html). Add a pair for every new post.
export const LOCALIZED_SEGMENTS = [
  ['kabluchki', 'koltsa'],
  ['serezhky', 'sergi'],
  ['kupyty-sribnu-kabluchku', 'kupit-serebryanoye-koltso'],
  ['kupyty-serezhky-sribni', 'kupit-serebryanyye-sergi'],
  ['kupyty-sribne-kolye', 'kupit-serebryanoye-kolye'],
  ['kupyty-sribnyy-braslet', 'kupit-serebryanyy-braslet'],
  ['yak-vyznachyty-rozmir-kabluchky', 'kak-uznat-razmer-kolca'],
  ['podarunok-divchyni-na-14-lyutoho', 'podarok-devushke-na-14-fevralya'],
  ['podarunok-na-8-bereznya', 'podarok-na-8-marta'],
];

/** The `lang` version of a URL segment from either locale ('kabluchki', 'ru' → 'koltsa'). */
export function localizeSegment(segment, lang) {
  const pair = LOCALIZED_SEGMENTS.find((p) => p.includes(segment));
  return pair ? pair[lang === 'ru' ? 1 : 0] : segment;
}

const LOCALE_RE = /^\/(uk|ru)(?=\/|$)/i;

/**
 * The one canonical form of a page URL (used by src/middleware.js): tracking params
 * removed, a lowercase /uk or /ru prefix (non-localized paths go to /uk), and the
 * locale's own category/product/blog slugs (/ru/kabluchki → /ru/koltsa).
 * Returns null when the URL is already canonical, so every fix is a single 301 hop.
 * @param {URL} nextUrl
 */
export function getCanonicalRedirect(nextUrl) {
  const url = new URL(nextUrl.href);
  let changed = false;

  for (const param of TRACKING_PARAMS) {
    if (url.searchParams.has(param)) {
      url.searchParams.delete(param);
      changed = true;
    }
  }

  const match = url.pathname.match(LOCALE_RE);
  const lang = match ? match[1].toLowerCase() : DEFAULT_LOCALE;
  const rest = match ? url.pathname.slice(match[0].length) : url.pathname === '/' ? '' : url.pathname;
  const pathname = `/${lang}${rest.split('/').map((s) => (s ? localizeSegment(s, lang) : s)).join('/')}`;

  if (pathname !== url.pathname) {
    url.pathname = pathname;
    changed = true;
  }
  return changed ? url : null;
}

export const SITE_NAME = 'Daisy Jewellery';
export const OG_LOCALE = { uk: 'uk_UA', ru: 'ru_UA' };
// Campaign photo of the homepage hero: a real brand image instead of the logo.
export const DEFAULT_OG_IMAGE = { url: '/banner.webp', width: 1870, height: 1403, alt: 'Daisy Jewellery' };

/** Absolute URL for a site path ('uk/kabluchki' or '/uk/kabluchki'). */
export const absoluteUrl = (path = '') => `${SITE_URL}/${String(path).replace(/^\/+/, '')}`.replace(/\/$/, '');

/**
 * Next.js `alternates` (canonical + hreflang) for a page.
 * @param {'uk'|'ru'} lang  locale of the rendered page
 * @param {{ uk: string, ru?: string|null }} paths  site paths of both versions (with locale prefix);
 *   ru = null when the page has no real Russian version: the ru URL then canonicalizes to uk.
 */
export function buildAlternates(lang, { uk, ru = null }) {
  const ukUrl = absoluteUrl(uk);
  const ruUrl = ru ? absoluteUrl(ru) : null;
  const languages = { 'uk-UA': ukUrl, 'x-default': ukUrl };
  if (ruUrl) languages['ru-UA'] = ruUrl;
  return { canonical: lang === 'ru' && ruUrl ? ruUrl : ukUrl, languages };
}

const seoHelpers = {
  buildCanonicalUrl,
  buildLocalizedCanonicalUrl,
  buildHreflangAlternates,
  hasTrackingParams,
  hasFacetParams,
  stripTrackingParams,
  getBaseUrlPath,
  getRobotsConfig,
  getProductHreflangPaths,
  getCategoryHreflangPaths,
  getSiteUrl,
  TRACKING_PARAMS,
  FACET_PARAMS,
  CATEGORY_SLUGS,
  PRODUCT_URL_SLUGS,
  SLUG_TO_CATEGORY_TYPE,
};

export default seoHelpers;
