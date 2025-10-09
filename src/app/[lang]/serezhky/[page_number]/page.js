import { fetchProduct } from '../../../../actions/fetchProduct';
import { getLogoJsonLd, getCategoryJsonLd } from '../../../../helpers/getJsonLd';
import { getPaginationData, getDeviceType, generateCategoryMetadata, is404Page, generate404MetaData } from '../../../../helpers';
import Gallery from '../../../../components/Gallery';
import { notFound } from 'next/navigation';

const allowedPages = [
  { page_number: '1' },
  { page_number: '2' },
  { page_number: '3' },
];

export async function generateStaticParams() {
  const langs = ['uk', 'ru'];
  const pages = allowedPages.map(p => p.page_number);
  return langs.flatMap(lang => pages.map(page_number => ({ lang, page_number })));
}

export async function generateMetadata({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const currentPage = +params.page_number;
  const is404 = is404Page(currentPage, allowedPages);
  if (is404) return generate404MetaData();

  const title = lang === 'ru'
    ? 'Серебряные серьги | Купить серебряные серьги Daisy Jewellery'
    : 'Срібні сережки | Купити срібні сережки Daisy Jewellery';
  const description = lang === 'ru'
    ? 'Серебряные серьги от Daisy Jewellery. Быстрая доставка по всей Украине!'
    : 'Срібні сережки від Daisy Jewellery. Швидка доставка по всій Україні!';
  const categorySlug = lang === 'ru' ? 'sergi' : 'serezhky';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage}`;
  const keywords = lang === 'ru' ? 'Серебряные серьги, купить' : 'Срібні сережки, купити';
  const lastPage = 3;
  return generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords, lang });
}

export default async function Page({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const baseSlug = lang === 'ru' ? 'sergi' : 'serezhky';
  const itemSlug = lang === 'ru' ? 'kupit-serebryanyye-sergi' : 'kupyty-serezhky-sribni';
  const baseURL = `/${lang}/${baseSlug}`;
  const itemBaseURL = `${baseURL}/${itemSlug}`;
  const categoryId = process.env.EARING_CATEGORY_ID;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const paginated = true;
  const { products, hasMore } = await fetchProduct({ offset, limit, categoryId, paginated });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';

  if (!products || !products.length) notFound();

  const logoJsonLd = getLogoJsonLd({ lang });
  const categoryJsonLd = getCategoryJsonLd({
    categoryName: lang === 'ru' ? 'Серебряные серьги от Daisy Jewellery' : 'Срібні сережки від Daisy Jewellery',
    categoryDescription: lang === 'ru' ? 'Серебряные серьги от Daisy Jewellery. Быстрая доставка по всей Украине!' : 'Срібні сережки від Daisy Jewellery. Швидка доставка по всій Україні!',
    url: `${baseURL}/${params.page_number}`,
    lowPrice: 400,
    highPrice: 2200
  });

  return (
    <>
      <h1 className="category-title">{lang === 'ru' ? 'Серебряные серьги' : 'Срібні сережки'}</h1>
      <Gallery
        items={products}
        hasMore={hasMore}
        currentPage={currentPage}
        baseURL={baseURL}
        itemBaseURL={itemBaseURL}
        withPagination={paginated}
        isMobile={isMobile}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }} />
    </>
  );
}


