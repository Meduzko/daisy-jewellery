import { headers } from 'next/headers';
import { getItemTranslations } from '../dictionaries';
import { 
  buildCanonicalUrl, 
  buildHreflangAlternates,
  getSiteUrl,
  PRODUCT_URL_SLUGS,
  CATEGORY_SLUGS,
} from './seo';

export function getDeviceType() {
  const userAgent = headers().get('user-agent') || '';
  const isEmulationTablet = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15';
  const isTablet = /iPad|Tablet|Android(?!.*Mobile)/i.test(userAgent);
  const isMobile = /Mobile|iP(hone|od)|Android.*Mobile|BlackBerry|IEMobile|Silk-Accelerated/i.test(userAgent);

  if (isTablet || userAgent.includes(isEmulationTablet)) return 'tablet';
  if (isMobile) return 'mobile';

  return 'desktop';
}

export function getIsMobile() {
  const deviceType = headers().get('x-device-type');
  return deviceType === 'mobile';
}

export const getPaginationData = (paramsPage) => {
  const currentPage = parseInt(paramsPage || 1, 10) || 1;
  const limit = 16;
  const offset = (currentPage - 1) * limit;

  return {
    limit,
    offset,
    currentPage
  }
};

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
 * Get product metadata including canonical URL, keywords and description
 * @param {string} categoryName - Category identifier
 * @param {string} productTitle - Product title  
 * @param {number} code - Product code
 * @param {string} short_description - Product short description with HTML
 * @param {string} lang - Language code
 * @returns {object} Product canonical and keywords metadata
 */
const getItemMetaData = ({ categoryName, productTitle, code, short_description, lang }) => {
  const siteUrl = getSiteUrl();
  
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
  
  const canonicalRes = `${siteUrl}/${lang}/${lang === 'uk' ? ukSlug : ruSlug}/${code}`;
  
  const shortDescription = short_description.replace(/<[^>]*>/g, '');
  const description = shortDescription.replace(/&[^;\s]+;/g, '');
  const descriptionSuffix = descriptionMap[lang][categoryName] || 'Купити від Daisy Jewellery';
  const descriptionRes = `${description.trim()} ${descriptionSuffix}`;
  
  const languages = {
    'uk-UA': `${siteUrl}/uk/${ukSlug}/${code}`,
    'ru-UA': `${siteUrl}/ru/${ruSlug}/${code}`
  };

  return {
    canonicalUrl: canonicalRes,
    keywords: keywordsRes,
    description: descriptionRes,
    languages
  }
};

/**
 * Generate product metadata
 * @param {*} param0 
 * @returns 
 */

export const getProductMetadata = async ({ product, categoryName, lang = 'uk' }) => {
  const siteName = 'Daisy Jewellery';
  const locale = lang === 'uk' ? 'uk_UA' : 'ru_UA';
  const { title, short_description, code } = product;

  const tk = await getItemTranslations({ lang, categoryName, code });
  const tkTitle = tk?.title || title;
  const tkDescription = tk?.description || short_description;

  const { keywords, canonicalUrl, description, languages } = getItemMetaData({ categoryName, title, code, short_description: tkDescription, lang });


  return {
    title: `${tkTitle} | ${siteName}`,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages
    },
    keywords,
    robots: {
      index: true,
      follow: true,
      nocache: true,
    },
    url: canonicalUrl,
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: canonicalUrl,
      siteName,
      locale,
      type: 'website',
    }
  }
};

/**
 * Generate category page metadata with unique titles for pagination
 * @param {object} options - Metadata options
 * @returns {object} Next.js metadata object
 */
export const generateCategoryMetadata = ({
  title,
  description,
  currentPage,
  lastPage,
  canonicalUrl,
  categorySlug,
  keywords,
  lang = 'uk'
}) => {
  const siteName = 'Daisy Jewellery';
  const locale = lang === 'uk' ? 'uk_UA' : 'ru_UA';
  const siteUrl = getSiteUrl();

  const translatedSlugs = getTralslatedCategorySlugs({ lang, categoryName: categorySlug, translatedMap: translatedCategorySlug });

  // Make title unique for pagination pages
  const pageIndicator = lang === 'uk' ? 'Сторінка' : 'Страница';
  const uniqueTitle = currentPage > 1 
    ? `${title} - ${pageIndicator} ${currentPage}` 
    : title;
  
  // Make description unique for pagination
  const uniqueDescription = currentPage > 1 
    ? `${description} ${pageIndicator} ${currentPage} з ${lastPage}.`
    : description;

  const baseMetaData = {
    title: uniqueTitle,
    description: uniqueDescription,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'uk-UA': `${siteUrl}/uk/${translatedSlugs.uk}/${currentPage}`,
        'ru-UA': `${siteUrl}/ru/${translatedSlugs.ru}/${currentPage}`
      }
    },
    robots: {
      index: true,
      follow: true,
      nocache: true,
    },
    icons: {
      other: [
        { rel: 'next', url: `${siteUrl}/${lang}/${categorySlug}/${currentPage + 1}` },
      ]
    },
    keywords,
    url: `${siteUrl}/${lang}/${categorySlug}/${currentPage}`,
    openGraph: {
      title: uniqueTitle,
      description: uniqueDescription,
      url: canonicalUrl,
      siteName,
      locale: locale,
      type: 'website',
    }
  }

  if (currentPage > 1 && currentPage < lastPage) {
    return {
      ...baseMetaData,
      icons: {
        other: [
          { rel: 'prev', url: `${siteUrl}/${lang}/${categorySlug}/${currentPage - 1}` },
          { rel: 'next', url: `${siteUrl}/${lang}/${categorySlug}/${currentPage + 1}` },
        ]
      }
    }
  }

  if (currentPage === lastPage) {
    return {
      ...baseMetaData,
      icons: {
        other: [
          { rel: 'prev', url: `${siteUrl}/${lang}/${categorySlug}/${currentPage - 1}` }
        ]
      }
    }
  }

  return baseMetaData;
}

export const categoryMap = {
  ring: process.env.RING_CATEGORY_ID,
  necklace: process.env.NECKLACE_CATEGORY_ID,
  earring: process.env.EARING_CATEGORY_ID,
  bracer: process.env.BRACER_CATEGORY_ID
};

export const defaultMetadata =  {
  uk: {
    metadataBase: new URL('https://daisy-jewellery.com.ua/uk'),
    title: 'Магазин срібних прикрас - Daisy Jewellery',
    description: 'Купити срібні прикраси – це легко з Daisy Jewellery. Вишуканість у кожній деталі!',
    keywords: [
      'купити',
      'срібні прикраси',
    ],
    authors: [{ name: 'A.P.', url: 'https://daisy-jewellery.com.ua' }],
    openGraph: {
      title: 'Магазин срібних прикрас - Daisy Jewellery',
      description: 'Купити срібні прикраси – це легко з Daisy Jewellery. Вишуканість у кожній деталі!',
      url: 'https://daisy-jewellery.com.ua/uk',
      siteName: 'Daisy Jewellery',
      images: [
        {
          url: '/logo_black.png',
          width: 800,
          height: 600,
          alt: 'Магазин срібних прикрас - Daisy Jewellery',
        },
      ],
      locale: 'uk_UA', // Updated locale for Ukrainian language
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@daisy-jewellery.com.ua',
      creator: '@O.P',
      title: 'Магазин срібних прикрас - Daisy Jewellery',
      description: 'Купити срібні прикраси – це легко з Daisy Jewellery. Вишуканість у кожній деталі!',
      image: '/logo_black.png',
      images: ['/logo_black.png'],
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/apple-touch-icon.png',
      other: [
        {
          rel: 'icon',
          url: '/favicon-16x16.png',
          sizes: '16x16',
        },
        {
          rel: 'icon',
          url: '/favicon-32x32.png',
          sizes: '32x32',
        },
        {
          rel: 'manifest',
          url: '/site.webmanifest',
        },
      ],
    },
    manifest: '/site.webmanifest',
    robots: {
      index: true,
      follow: true,
      nocache: true,
    },
    alternates: {
      canonical: 'https://daisy-jewellery.com.ua',
      languages: {
        'uk-UA': 'https://daisy-jewellery.com.ua/uk',
        'ru-UA': 'https://daisy-jewellery.com.ua/ru',
      },
    },
    other: {
      // Added structured data for your logo
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'Daisy Jewellery',
        'url': 'https://daisy-jewellery.com.ua',
        'logo': 'https://daisy-jewellery.com.ua/logo_black.png',
      }),
    }
  },
  ru: {
    metadataBase: new URL('https://daisy-jewellery.com.ua/ru'),
    title: 'Магазин серебряных украшений - Daisy Jewellery',
    description: 'Купить серебряные украшения - это легко с Daisy Jewellery. Изысканность в каждой детали!',
    keywords: [
      'купить ',
      'серебряные украшения',
    ],
    authors: [{ name: 'A.P.', url: 'https://daisy-jewellery.com.ua/ru' }],
    openGraph: {
      title: 'Магазин серебряных украшений - Daisy Jewellery',
      description: 'Купить серебряные украшения - это легко с Daisy Jewellery. Изысканность в каждой детали!',
      url: 'https://daisy-jewellery.com.ua/ru',
      siteName: 'Daisy Jewellery',
      images: [
        {
          url: '/logo_black.png',
          width: 800,
          height: 600,
          alt: 'Магазин серебряных украшений - Daisy Jewellery',
        },
      ],
      locale: 'ru_UA', // Updated locale for Ukrainian language
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@daisy-jewellery.com.ua',
      creator: '@O.P',
      title: 'Магазин серебряных украшений - Daisy Jewellery',
      description: 'Купить серебряные украшения - это легко с Daisy Jewellery. Изысканность в каждой детали!',
      image: '/logo_black.png',
      images: ['/logo_black.png'],
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/apple-touch-icon.png',
      other: [
        {
          rel: 'icon',
          url: '/favicon-16x16.png',
          sizes: '16x16',
        },
        {
          rel: 'icon',
          url: '/favicon-32x32.png',
          sizes: '32x32',
        },
        {
          rel: 'manifest',
          url: '/site.webmanifest',
        },
      ],
    },
    manifest: '/site.webmanifest',
    robots: {
      index: true,
      follow: true,
      nocache: true,
    },
    alternates: {
      canonical: 'https://daisy-jewellery.com.ua/ru',
      languages: {
        'uk-UA': 'https://daisy-jewellery.com.ua/uk',
        'ru-UA': 'https://daisy-jewellery.com.ua/ru',
      },
    },
    other: {
      // Added structured data for your logo
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'Daisy Jewellery',
        'url': 'https://daisy-jewellery.com.ua',
        'logo': 'https://daisy-jewellery.com.ua/logo_black.png',
      }),
    }
  }
};

export const getDefaultMetaData = ({ pagePath, title, description, lang = 'uk' } = {}) => {
  const siteUrl = getSiteUrl();
  const newTitle = title || 'Магазин срібних прикрас - Daisy Jewellery';
  const newDescription = description || defaultMetadata[lang].description;
  
  const result = {
    ...defaultMetadata[lang],
    title: newTitle,
    description: newDescription,
    openGraph: {
      ...defaultMetadata[lang].openGraph,
      title: newTitle,
      description: newDescription,
      url: `${siteUrl}/${lang}/${pagePath}`,
    },
    twitter: {
      ...defaultMetadata[lang].twitter,
      title: newTitle,
      description: newDescription,
    },
    alternates: {
      ...defaultMetadata[lang].alternates,
      canonical: `${siteUrl}/${lang}/${pagePath}`,
      languages: {
        'uk-UA': `${siteUrl}/uk/${pagePath}`,
        'ru-UA': `${siteUrl}/ru/${pagePath}`
      },
    },
  };

  return result;
};

export const generate404MetaData = () => ({
  title: '404 - Page Not Found',
  robots: {
    index: false,
    follow: false,
  },
});

export const is404Page = (currentPage, allowedPages) => {
  const currPage = allowedPages.find(ap => +ap.page_number === +currentPage)

  return !currPage;
};
