import { headers } from 'next/headers';
import { getItemTranslations } from '../dictionaries';
import { getDisplayPrices } from './productPricing';
import {
  PRODUCT_URL_SLUGS,
  SITE_NAME,
  OG_LOCALE,
  DEFAULT_OG_IMAGE,
  buildAlternates,
} from './seo';

export async function getDeviceType() {
  const userAgent = (await headers()).get('user-agent') || '';
  const isEmulationTablet = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15';
  const isTablet = /iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent);
  const isMobile = /Mobile|iP(hone|od)|Android.*Mobile|BlackBerry|IEMobile|Silk-Accelerated/i.test(userAgent);

  if (isTablet || userAgent.includes(isEmulationTablet)) return 'tablet';
  if (isMobile) return 'mobile';

  return 'desktop';
}

export async function getIsMobile() {
  const deviceType = (await headers()).get('x-device-type');
  return deviceType === 'mobile';
}

const tralslatedCat = {
  uk: {
    ring: 'koltsa',
    earring: 'sergi',
    necklace: 'kolye',
    bracer: 'braslety',
    // Also support URL slugs as keys
    kabluchki: 'koltsa',
    serezhky: 'sergi',
    kolye: 'kolye',
    braslety: 'braslety',
  },
  ru: {
    koltsa: 'ring',
    sergi: 'earring',
    kolye: 'necklace',
    braslety: 'bracer',
    // Also support URL slugs as keys (maps to UK slugs)
    koltsa: 'kabluchki',
    sergi: 'serezhky',
    kolye: 'kolye',
    braslety: 'braslety',
  }
};

const translatedCategorySlug = {
  uk: {
    kabluchki: 'koltsa',
    serezhky: 'sergi',
    kolye: 'kolye',
    braslety: 'braslety'
  },
  ru: {
    koltsa: 'kabluchki',
    sergi: 'serezhky',
    kolye: 'kolye',
    braslety: 'braslety'
  }
}

const getTralslatedCategorySlugs = ({ lang, categoryName, translatedMap }) => {
  const translationMap = translatedMap || tralslatedCat;
  const translatedCat = translationMap[lang][categoryName];

  if (lang === 'uk') {
    return {
      uk: categoryName,
      ru: translatedCat
    }
  } else {
    return {
      uk: translatedCat,
      ru: categoryName
    }
  }
};

/**
 * Product keywords, meta-description suffix and the uk/ru site paths of a product.
 * @param {{ categoryName: string, code: number|string, lang: 'uk'|'ru' }} options
 */
const getItemMetaData = ({ categoryName, code, lang }) => {
  const keywords = {
    uk: {
      ring: 'срібні каблучки, каблучка срібло 925, купити каблучку срібну, жіночі каблучки, каблучки Україна',
      earring: 'срібні сережки, сережки срібло 925, купити сережки срібні, жіночі сережки, сережки Україна',
      necklace: 'срібне кольє, кольє срібло 925, купити кольє срібне, жіноче кольє, кольє Україна',
      bracer: 'срібний браслет, браслет срібло 925, купити браслет срібний, жіночий браслет, браслети Україна',
      // URL slugs
      kabluchki: 'срібні каблучки, каблучка срібло 925, купити каблучку срібну, жіночі каблучки, каблучки Україна',
      serezhky: 'срібні сережки, сережки срібло 925, купити сережки срібні, жіночі сережки, сережки Україна',
      kolye: 'срібне кольє, кольє срібло 925, купити кольє срібне, жіноче кольє, кольє Україна',
      braslety: 'срібний браслет, браслет срібло 925, купити браслет срібний, жіночий браслет, браслети Україна',
    },
    ru: {
      koltsa: 'серебряные кольца, кольцо серебро 925, купить кольцо серебряное, женские кольца, кольца Украина',
      sergi: 'серебряные серьги, серьги серебро 925, купить серьги серебряные, женские серьги, серьги Украина',
      kolye: 'серебряное колье, колье серебро 925, купить колье серебряное, женское колье, колье Украина',
      braslety: 'серебряный браслет, браслет серебро 925, купить браслет серебряный, женский браслет, браслеты Украина',
    }
  };

  const descriptionMap = {
    uk: {
      ring: 'Купити срібну каблучку від Daisy Jewellery',
      earring: 'Купити сережки срібні від Daisy Jewellery',
      necklace: 'Купити срібне кольє від Daisy Jewellery',
      bracer: 'Купити браслет зі срібла від Daisy Jewellery',
      // URL slugs
      kabluchki: 'Купити срібну каблучку від Daisy Jewellery',
      serezhky: 'Купити сережки срібні від Daisy Jewellery',
      kolye: 'Купити срібне кольє від Daisy Jewellery',
      braslety: 'Купити браслет зі срібла від Daisy Jewellery',
    },
    ru: {
      koltsa: 'Купить серебряное кольцо от Daisy Jewellery',
      sergi: 'Купить серьги серебряные от Daisy Jewellery',
      kolye: 'Купить серебряное колье от Daisy Jewellery',
      braslety: 'Купить браслет из серебра от Daisy Jewellery',
    }
  };

  const defaultKeywords = lang === 'uk' 
    ? 'срібні прикраси, ювелірні вироби срібло 925, купити прикраси Україна, Daisy Jewellery'
    : 'серебряные украшения, ювелирные изделия серебро 925, купить украшения Украина, Daisy Jewellery';
  const keywordsRes = keywords[lang][categoryName] || defaultKeywords;
  
  const translatedSlugs = getTralslatedCategorySlugs({ lang, categoryName });
  // Use the correct key for each locale's lookup
  const ukSlug = PRODUCT_URL_SLUGS.uk[translatedSlugs.uk];
  const ruSlug = PRODUCT_URL_SLUGS.ru[translatedSlugs.ru];
  
  const descriptionSuffix = descriptionMap[lang][categoryName] || (lang === 'ru' ? 'Купить в Daisy Jewellery' : 'Купити в Daisy Jewellery');

  return {
    keywords: keywordsRes,
    descriptionSuffix,
    paths: { uk: `uk/${ukSlug}/${code}`, ru: `ru/${ruSlug}/${code}` },
  };
};

/**
 * Generate product metadata
 * @param {*} param0 
 * @returns 
 */

/** Plain text of `html`, cut after whole sentences to ≈ `max` characters (meta description). */
export const toMetaSummary = (html, max = 160) => {
  const text = String(html || '').replace(/<[^>]*>/g, ' ').replace(/&[^;\s]+;/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [];
  let out = '';
  for (const s of sentences) {
    if ((out + s).trim().length > max) break;
    out += s;
  }
  if (out.trim()) return out.trim();
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max).trim()}…`;
};

export const getProductMetadata = async ({ product, categoryName, lang = 'uk' }) => {
  const { title, short_description, code } = product;

  const tk = await getItemTranslations({ lang, categoryName, code });
  const tkTitle = tk?.title || title;
  // DB products whose text came from the content sheets have only `description`
  // (short_description cleared) — use its opening sentences for the meta description.
  const tkDescription = tk?.description || short_description || product.description || '';

  // A ru page without a Russian translation shows the Ukrainian text: it is a duplicate
  // of the uk page, so it canonicalizes there, is not offered as a ru alternate, and its
  // meta description stays entirely Ukrainian (no mixed-language snippet).
  const hasOwnLocale = !(lang === 'ru' && product.is_fallback);
  const textLang = hasOwnLocale ? lang : 'uk';
  const { keywords, descriptionSuffix, paths } = getItemMetaData({ categoryName: hasOwnLocale ? categoryName : product.category || categoryName, code, lang: textLang });
  const { price } = getDisplayPrices(product);
  const priceText = Number(price) > 0 ? (textLang === 'ru' ? `Цена ${price} грн.` : `Ціна ${price} грн.`) : '';
  const generatedDescription = [toMetaSummary(tkDescription, 110), priceText, `${descriptionSuffix}.`].filter(Boolean).join(' ');
  // Explicit SEO texts from the PostgreSQL catalog (product_translations.seo_*) win when set.
  const description = product.seo_description || generatedDescription;
  const pageTitle = product.seo_title || `${tkTitle} | ${SITE_NAME}`;
  const alternates = buildAlternates(lang, { uk: paths.uk, ru: hasOwnLocale ? paths.ru : null });
  const images = (product.images?.length ? product.images : [product.image_path]).filter(Boolean).slice(0, 4);

  return {
    title: pageTitle,
    description,
    alternates,
    keywords,
    openGraph: {
      title: pageTitle,
      description,
      url: alternates.canonical,
      siteName: SITE_NAME,
      locale: OG_LOCALE[lang],
      type: 'website',
      images: images.length ? images.map((url) => ({ url, alt: tkTitle })) : [DEFAULT_OG_IMAGE],
    },
  };
};

/**
 * Category page metadata. Each category has a single URL (/{lang}/{slug});
 * there are no numbered listing pages.
 * @param {object} options - Metadata options
 * @returns {object} Next.js metadata object
 */
export const generateCategoryMetadata = ({
  title,
  description,
  categorySlug,
  keywords,
  image,
  lang = 'uk'
}) => {
  const translatedSlugs = getTralslatedCategorySlugs({ lang, categoryName: categorySlug, translatedMap: translatedCategorySlug });
  const alternates = buildAlternates(lang, { uk: `uk/${translatedSlugs.uk}`, ru: `ru/${translatedSlugs.ru}` });

  return {
    title,
    description,
    alternates,
    keywords,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      siteName: SITE_NAME,
      locale: OG_LOCALE[lang],
      type: 'website',
      images: [image || DEFAULT_OG_IMAGE],
    },
  };
}

export const categoryMap = {
  ring: process.env.RING_CATEGORY_ID,
  necklace: process.env.NECKLACE_CATEGORY_ID,
  earring: process.env.EARING_CATEGORY_ID,
  bracer: process.env.BRACER_CATEGORY_ID
};

/**
 * Metadata of a static page that exists at /uk/{pagePath} and /ru/{pagePath}.
 * Icons, manifest, robots and the twitter card come from the [lang] layout.
 * @param {{ pagePath: string, title: string, description: string, lang?: 'uk'|'ru', ruAvailable?: boolean }} options
 *   ruAvailable: false when the ru URL only repeats the Ukrainian text (canonical → uk).
 */
export const getDefaultMetaData = ({ pagePath, title, description, lang = 'uk', ruAvailable = true } = {}) => {
  const path = pagePath ? `/${pagePath}` : '';
  const alternates = buildAlternates(lang, { uk: `uk${path}`, ru: ruAvailable ? `ru${path}` : null });

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      siteName: SITE_NAME,
      locale: OG_LOCALE[lang],
      type: 'website',
      images: [DEFAULT_OG_IMAGE],
    },
  };
};

export const generate404MetaData = () => ({
  title: '404 - Page Not Found',
  robots: {
    index: false,
    follow: false,
  },
});
