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
  }

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
      braslety: 'braslety/kupit-serebryanyy-braslet/',
    }
  }

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
  }

  const keywordsRes = `${keywords[lang][categoryName]}`;
  const canonicalRes = `${process.env.SITE_DOMAIN}/${lang}/${canonical[lang][categoryName]}/${code}`;
  const shortDescription = short_description.replace(/<[^>]*>/g, '');
  const description = shortDescription.replace(/&[^;\s]+;/g, '');
  const descriptionRes = `${description.trim()} ${descriptionMap[lang][categoryName]}`;

  return {
    canonicalUrl: canonicalRes,
    keywords: keywordsRes,
    description: descriptionRes
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

  const { keywords, canonicalUrl, description } = getItemMetaData({ categoryName, title, code, short_description: tkDescription, lang });


  return {
    title: `${tkTitle} | ${siteName}`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords,
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

  const baseMetaData = {
    title,
    description,
    alternates: {
      canonical: canonicalUrl
    },
    icons: {
      other: [
        { rel: 'next', url: `${process.env.SITE_DOMAIN}/${categorySlug}/${currentPage + 1}` },
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
  metadataBase: new URL('https://daisy-jewellery.com.ua'),
  title: 'Магазин срібних прикрас - Daisy Jewellery',
  description: 'Купити срібні прикраси – це легко з Daisy Jewellery. Вишуканість у кожній деталі!',
  keywords: [
    'jewellery',
    'daisy jewellery',
    'срібло',
    'купити',
    'купити сріні прикраси',
    'срібні прикраси',
    'срібні каблучки',
    'срібні сережки',
    'срібні кольє',
    'срібні браслети',
    'каблучки',
    'сережки',
    'кольє',
    'браслети'
  ],
  authors: [{ name: 'A.P.', url: 'https://daisy-jewellery.com.ua' }],
  openGraph: {
    title: 'Магазин срібних прикрас - Daisy Jewellery',
    description: 'Купити срібні прикраси – це легко з Daisy Jewellery. Вишуканість у кожній деталі!',
    url: 'https://daisy-jewellery.com.ua',
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
      'uk-UA': 'https://daisy-jewellery.com.ua/uk-UA',
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
  },
};

export const getDefaultMetaData = ({ pagePath, title, description }) => {
  const newTitle = title || 'Магазин срібних прикрас - Daisy Jewellery';

  const result = {
    ...defaultMetadata,
    title: newTitle,
    openGraph: {
      ...defaultMetadata.openGraph,
      title: newTitle
    },
    twitter: {
      ...defaultMetadata.twitter,
      title: newTitle
    },
    alternates: {
      ...defaultMetadata.alternates,
      canonical: `https://daisy-jewellery.com.ua/${pagePath}`,
    },
  };

  return result;
};
