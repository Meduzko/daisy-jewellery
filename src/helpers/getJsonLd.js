import { decode } from 'html-entities';
import { getItemTranslations } from '../dictionaries';
import { getCategoryConfig } from '../components/Category/config';
import { SOCIAL } from '../components/Home/copy';
import { getDisplayPrices } from './productPricing';
import { isProductAvailable } from './productAvailability';
import { absoluteUrl, SITE_NAME, SLUG_TO_CATEGORY_TYPE } from './seo';

// JSON-LD builders (schema.org). Only real data: catalog fields, the shop's own
// contact details and copy that is shown on the site. No ratings, reviews or
// shipping terms are declared.

const ORGANIZATION_ID = `${absoluteUrl('')}/#organization`;
const WEBSITE_ID = `${absoluteUrl('')}/#website`;
const IN_LANGUAGE = { uk: 'uk-UA', ru: 'ru-UA' };

const plainText = (html) => decode(String(html || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

/** @param {{ name: string, path: string }[]} items  site paths with locale prefix, home first */
export const getBreadcrumbJsonLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

const homeCrumb = (lang) => ({ name: lang === 'ru' ? 'Главная' : 'Головна', path: lang });

/**
 * Category listing: CollectionPage whose main entity is the list of products shown
 * on the server-rendered first page, plus breadcrumbs. (A category is not a Product,
 * so no Product/AggregateOffer markup here.)
 * @param {{ name: string, description: string, path: string, lang: 'uk'|'ru', items: { name: string, path: string }[] }} options
 */
export const getCategoryJsonLd = ({ name, description, path, lang, items = [] }) => [
  {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name,
    description,
    inLanguage: IN_LANGUAGE[lang],
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(item.path),
        name: item.name,
      })),
    },
  },
  getBreadcrumbJsonLd([homeCrumb(lang), { name, path }]),
];

export const getProductJsonLd = async (product, categoryUrl, options = {}) => {
  const { title, code } = product;
  const { price } = getDisplayPrices(product);
  const { lang, categoryName } = options;
  const locale = lang === 'ru' ? 'ru' : 'uk';

  // Content-sheet products have only `description` (short_description cleared).
  const tk = await getItemTranslations({ lang: locale, categoryName, code });
  const name = tk?.title || title;
  const description = plainText(tk?.description || product.short_description || product.description);
  const path = `${locale}/${categoryUrl}/${code}`;
  const url = absoluteUrl(path);
  const images = (product.images?.length ? product.images : [product.image_path]).filter(Boolean);
  const metals = (product.attributes || []).find((a) => a.code === 'metal')?.values?.map((v) => v.value).filter(Boolean) || [];

  const productJsonLd = {
    '@type': 'Product',
    '@id': `${url}#product`,
    name,
    url,
    image: images,
    description: description || undefined,
    sku: product.sku || String(code),
    productID: String(code),
    brand: { '@type': 'Brand', name: SITE_NAME },
    material: metals.length ? metals.join(', ') : locale === 'ru' ? 'Серебро 925' : 'Срібло 925',
  };

  // An Offer without a real price is invalid; leave it out rather than invent one.
  if (Number(price) > 0) {
    productJsonLd.offers = {
      '@type': 'Offer',
      url,
      price: String(price),
      priceCurrency: 'UAH',
      availability: isProductAvailable(product) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': ORGANIZATION_ID },
    };
  }

  const categoryConfig = getCategoryConfig(SLUG_TO_CATEGORY_TYPE[String(categoryUrl).split('/')[0]]);
  const crumbs = [homeCrumb(locale)];
  if (categoryConfig) crumbs.push({ name: categoryConfig.name[locale], path: `${locale}/${categoryConfig.slugs[locale]}` });
  crumbs.push({ name, path });
  const { '@context': _context, ...breadcrumbJsonLd } = getBreadcrumbJsonLd(crumbs);

  return { '@context': 'https://schema.org', '@graph': [productJsonLd, breadcrumbJsonLd] };
};

/** The shop as an organization (online store). Rendered on every page type. */
export const getLogoJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  '@id': ORGANIZATION_ID,
  name: SITE_NAME,
  url: absoluteUrl('uk'),
  logo: {
    '@type': 'ImageObject',
    url: absoluteUrl('logo_black.png'),
    width: 1652,
    height: 1352,
  },
  image: absoluteUrl('banner.webp'),
  email: SOCIAL.email,
  telephone: SOCIAL.phone,
  sameAs: [SOCIAL.instagram, SOCIAL.facebook],
  currenciesAccepted: 'UAH',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'вулиця Київська 3/3',
    addressLocality: 'Корець',
    postalCode: '34700',
    addressCountry: 'UA',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: SOCIAL.phone,
    email: SOCIAL.email,
    contactType: 'customer support',
    availableLanguage: ['uk', 'ru'],
  },
});

export const getWebSiteJsonLd = ({ lang = 'uk' } = {}) => {
  const data = {
    uk: {
      description: 'Інтернет-магазин срібних прикрас 925 проби: каблучки, сережки, кольє та браслети з доставкою по Україні.',
    },
    ru: {
      description: 'Интернет-магазин серебряных украшений 925 пробы: кольца, серьги, колье и браслеты с доставкой по Украине.',
    },
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: absoluteUrl(lang),
    name: SITE_NAME,
    description: data[lang === 'ru' ? 'ru' : 'uk'].description,
    inLanguage: IN_LANGUAGE[lang === 'ru' ? 'ru' : 'uk'],
    publisher: { '@id': ORGANIZATION_ID },
  };
};

/**
 * Blog article. `date` is the post's own «DD.MM.YYYY» publication date.
 * @param {{ title: string, description: string, date: string, image?: string|null, path: string, lang: 'uk'|'ru' }} post
 */
export const getBlogPostingJsonLd = ({ title, description, date, image, path, lang }) => {
  const [day, month, year] = String(date || '').split('.');
  const datePublished = year && month && day ? `${year}-${month}-${day}` : undefined;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description,
      datePublished,
      image: image ? [absoluteUrl(image)] : undefined,
      inLanguage: IN_LANGUAGE[lang],
      mainEntityOfPage: absoluteUrl(path),
      url: absoluteUrl(path),
      author: { '@id': ORGANIZATION_ID, '@type': 'Organization', name: SITE_NAME, url: absoluteUrl('uk') },
      publisher: { '@id': ORGANIZATION_ID },
    },
    getBreadcrumbJsonLd([
      homeCrumb(lang),
      { name: 'Блог', path: `${lang}/blog` },
      { name: title, path },
    ]),
  ];
};
