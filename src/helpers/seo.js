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
  'source',
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
 * @param {string} path - Path without leading slash (e.g., 'uk/kabluchki/1')
 * @returns {string} Absolute URL
 */
export function buildCanonicalUrl(path) {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${SITE_URL}/${cleanPath}`;
}

/**
 * Build canonical URL for a specific locale
 * @param {string} lang - Locale code ('uk' or 'ru')
 * @param {string} path - Path without locale prefix (e.g., 'kabluchki/1')
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
