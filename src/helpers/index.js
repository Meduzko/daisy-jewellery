import { headers } from 'next/headers';
import { getItemTranslations } from '../dictionaries';

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
  const limit = 15;
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
    bracer: 'braslety'
  },
  ru: {
    koltsa: 'ring',
    sergi: 'earring',
    kolye: 'necklace',
    braslety: 'bracer'
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
 * 
 * @param {string} categoryName 
 * @param {string} productTitle 
 * @param {number} code 
 * @returns product canonical and keywords metadata
 */
const getItemMetaData = ({ categoryName, productTitle, code, short_description, lang }) => {
  const keywords = {
    uk: {
      ring: 'Срібло, Каблучки',
      earring: 'Срібло, Сережки',
      necklace: 'Срібло, Кольє',
      bracer: 'Срібло, Браслети',
    },
    ru: {
      koltsa: 'Серебро, Кольца',
      sergi: 'Серебро, Серьги',
      kolye: 'Серебро, Колье',
      braslety: 'Серебро, Браслеты',
    }
  };

  const canonical = {
    uk: {
      ring: 'kabluchki/kupyty-sribnu-kabluchku',
      earring: 'serezhky/kupyty-serezhky-sribni',
      necklace: 'kolye/kupyty-sribne-kolye',
      bracer: 'braslety/kupyty-sribnyy-braslet',
    },
    ru: {
      koltsa: 'koltsa/kupit-serebryanoye-koltso',
      sergi: 'sergi/kupit-serebryanyye-sergi',
      kolye: 'kolye/kupit-serebryanoye-kolye',
      braslety: 'braslety/kupit-serebryanyy-braslet',
    }
  };

  const descriptionMap = {
    uk: {
      ring: 'Купити срібну каблучку від Daisy Jewellery',
      earring: 'Купити сережки срібні від Daisy Jewellery',
      necklace: 'Купити срібне кольє від Daisy Jewellery',
      bracer: 'Купити браслет зі срібла від Daisy Jewellery',
    },
    ru: {
      koltsa: 'Купить серебряное кольцо от Daisy Jewellery',
      sergi: 'Купить серьги серебряные от Daisy Jewellery',
      kolye: 'Купить серебряное колье от Daisy Jewellery',
      braslety: 'Купить браслет из серебра от Daisy Jewellery',
    }
  };

  const keywordsRes = `${keywords[lang][categoryName]}`;
  const canonicalRes = `${process.env.SITE_DOMAIN}/${lang}/${canonical[lang][categoryName]}/${code}`;
  const shortDescription = short_description.replace(/<[^>]*>/g, '');
  const description = shortDescription.replace(/&[^;\s]+;/g, '');
  const descriptionRes = `${description.trim()} ${descriptionMap[lang][categoryName]}`;
  // Canonical hreflang
  const translatedSlugs = getTralslatedCategorySlugs({ lang, categoryName });
  const languages = {
    'uk-UA': `${process.env.SITE_DOMAIN || 'https://daisy-jewellery.com.ua'}/uk/${canonical.uk[translatedSlugs.uk]}/${code}`,
    'ru-UA': `${process.env.SITE_DOMAIN || 'https://daisy-jewellery.com.ua'}/ru/${canonical.ru[translatedSlugs.ru]}/${code}`
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
 * Generate category page metadata
 * @param {*} param0 
 * @returns 
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

  const translatedSlugs = getTralslatedCategorySlugs({ lang, categoryName: categorySlug, translatedMap: translatedCategorySlug });

  const baseMetaData = {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'uk-UA': `${process.env.SITE_DOMAIN}/uk/${translatedSlugs.uk}/${currentPage}`,
        'ru-UA': `${process.env.SITE_DOMAIN}/ru/${translatedSlugs.ru}/${currentPage}`
      }
    },
    // robots: {
    //   index: true,
    //   follow: true,
    //   nocache: true,
    // },
    icons: {
      other: [
        { rel: 'next', url: `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage + 1}` },
      ]
    },
    keywords,
    url: `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/1`,
    openGraph: {
      title,
      description,
      url: `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/1`,
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
          { rel: 'prev', url: `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage - 1}` },
          { rel: 'next', url: `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage + 1}` },
        ]
      }
    }
  }

  if (currentPage === lastPage) {
    return {
      ...baseMetaData,
      icons: {
        other: [
          { rel: 'prev', url: `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage - 1}` }
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
  const newTitle = title || 'Магазин срібних прикрас - Daisy Jewellery';
  const result = {
    ...defaultMetadata[lang],
    title: newTitle,
    openGraph: {
      ...defaultMetadata[lang].openGraph,
      title: newTitle
    },
    twitter: {
      ...defaultMetadata[lang].twitter,
      title: newTitle
    },
    alternates: {
      ...defaultMetadata[lang].alternates,
      canonical: `https://daisy-jewellery.com.ua/${lang}/${pagePath}`,
      languages: {
        'uk-UA': `https://daisy-jewellery.com.ua/uk/${pagePath}`,
        'ru-UA': `https://daisy-jewellery.com.ua/ru/${pagePath}`
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
