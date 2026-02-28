import { getLogoJsonLd, getCategoryJsonLd } from '../../../../helpers/getJsonLd';
import { getPaginationData, getDeviceType, generateCategoryMetadata, generate404MetaData } from '../../../../helpers';
import { getCachedTotalPages, getCachedProducts } from '../../../../lib/dataCache';
import Gallery from '../../../../components/Gallery';
import { notFound } from 'next/navigation';

const ITEMS_PER_PAGE = 16;
const CATEGORY_ID = process.env.EARING_CATEGORY_ID;

export async function generateStaticParams() {
  const totalPages = await getCachedTotalPages(CATEGORY_ID, ITEMS_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
  return pages.map(page_number => ({ lang: 'uk', page_number }));
}

export async function generateMetadata({ params }) {
  const lang = 'uk';
  const currentPage = +params.page_number;
  const totalPages = await getCachedTotalPages(CATEGORY_ID, ITEMS_PER_PAGE);

  if (isNaN(currentPage) || currentPage < 1 || currentPage > totalPages) {
    return generate404MetaData();
  }

  const title = 'Срібні сережки | Купити срібні сережки Daisy Jewellery';
  const description = 'Срібні сережки від Daisy Jewellery. Швидка доставка по всій Україні!';
  const categorySlug = 'serezhky';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage}`;
  const keywords = 'Срібні сережки, купити';
  const lastPage = totalPages;
  return generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords, lang });
}

export default async function Page({ params }) {
  const lang = 'uk';
  const baseSlug = 'serezhky';
  const itemSlug = 'kupyty-serezhky-sribni';
  const baseURL = `/${lang}/${baseSlug}`;
  const itemBaseURL = `${baseURL}/${itemSlug}`;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const { products, hasMore } = await getCachedProducts({ categoryId: CATEGORY_ID, offset, limit });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';

  if (!products || !products.length) notFound();

  const logoJsonLd = getLogoJsonLd({ lang });
  const categoryJsonLd = getCategoryJsonLd({
    categoryName: 'Срібні сережки від Daisy Jewellery',
    categoryDescription: 'Срібні сережки від Daisy Jewellery. Швидка доставка по всій Україні!',
    url: `${baseURL}/${params.page_number}`,
    lowPrice: 400,
    highPrice: 2200
  });

  return (
    <>
      <h1 className="category-title">Срібні сережки</h1>
      <Gallery
        items={products}
        hasMore={hasMore}
        currentPage={currentPage}
        baseURL={baseURL}
        itemBaseURL={itemBaseURL}
        withPagination={true}
        isMobile={isMobile}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }} />
    </>
  );
}


