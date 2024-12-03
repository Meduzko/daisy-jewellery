import { headers } from 'next/headers';

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
const getItemMetaData = (categoryName, productTitle, code) => {
  const keywords = {
    ring: `Срібло, Каблучки`,
    earring: `Срібло, Сережки`,
    necklace: `Срібло, Кольє`,
    bracer: `Срібло, Браслети`,
  }

  const canonical = {
    ring: 'kabluchki/kupyty-sribnu-kabluchku',
    earring: 'serezhky/kupyty-serezhky-sribni',
    necklace: 'kolye/kupyty-sribne-kolye',
    bracer: 'braslety/kupyty-sribnyy-braslet',
  }

  const keywordsRes = `${keywords[categoryName]}, ${productTitle}`;
  const canonicalRes = `${process.env.SITE_DOMAIN}/${canonical[categoryName]}/${code}`

  return {
    canonicalUrl: canonicalRes,
    keywords: keywordsRes
  }
};

/**
 * Generate product metadata
 * @param {*} param0 
 * @returns 
 */

export const getProductMetadata = ({ product, categoryName }) => {
  const { title, short_description, code } = product;
  const siteName = 'Daisy Jewellery';
  const { keywords, canonicalUrl } = getItemMetaData(categoryName, title, code);
  const shortDescription = short_description.replace(/<[^>]*>/g, '');
  const description = shortDescription.replace(/&[^;\s]+;/g, '');

  return {
    title: `${title} | ${siteName}`,
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
      locale: 'uk_UA',
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
  canonicalUrl,
  categorySlug,
  keywords
}) => {
  const siteName = 'Daisy Jewellery';

  const baseMetaData = {
    title: `${title} | ${siteName}`,
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
    url: `${process.env.SITE_DOMAIN}/${categorySlug}/1`,
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: `${process.env.SITE_DOMAIN}/${categorySlug}/1`,
      siteName,
      locale: 'uk_UA',
      type: 'website',
    }
  }

  if (currentPage > 1) {
    return {
      ...baseMetaData,
      icons: {
        other: [
          { rel: 'prev', url: `${process.env.SITE_DOMAIN}/${categorySlug}/${currentPage - 1}` },
          { rel: 'next', url: `${process.env.SITE_DOMAIN}/${categorySlug}/${currentPage + 1}` },
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
