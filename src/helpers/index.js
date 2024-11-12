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
  const limit = 16;
  const offset = (currentPage - 1) * limit;

  return {
    limit,
    offset,
    currentPage
  }
};

const getKeywords = (categoryName, productTitle) => {
  const keywords = {
    ring: `Срібло, Каблучки`,
    earring: `Срібло, Сережки`,
    necklace: `Срібло, Кольє`,
    bracer: `Срібло, Браслети`,
  }

  return `${keywords[categoryName]}, ${productTitle}`;
};

export const getProductMetadata = ({ product, categoryName }) => {
  const { title, short_description, code } = product;
  const siteName = 'Daisy Jewellery';
  const keywords = getKeywords(categoryName, title);
  const shortDescription = short_description.replace(/<[^>]*>/g, '');
  const description = shortDescription.replace(/&[^;\s]+;/g, '');
  const canonicalUrl = `${process.env.SITE_DOMAIN}/category/${categoryName}/${code}`;

  return {
    title: `${title} | ${siteName}`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    keywords,
    url: `${process.env.SITE_DOMAIN}/category/${categoryName}/${code}`,
    openGraph: {
      title: `${title} | ${siteName}`,
      description,
      url: `${process.env.SITE_DOMAIN}/category/${categoryName}/${code}`,
      siteName,
      locale: 'uk_UA',
      type: 'website',
    }
  }
};

export const categoryMap = {
  ring: process.env.RING_CATEGORY_ID,
  necklace: process.env.NECKLACE_CATEGORY_ID,
  earring: process.env.EARING_CATEGORY_ID,
  bracer: process.env.BRACER_CATEGORY_ID
};
