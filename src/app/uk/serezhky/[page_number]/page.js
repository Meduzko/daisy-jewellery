import { notFound } from 'next/navigation';
import { getLogoJsonLd, getCategoryJsonLd } from '../../../../helpers/getJsonLd';
import { fetchProduct } from '../../../../actions/fetchProduct';
import { getPaginationData, getDeviceType, generateCategoryMetadata, is404Page, generate404MetaData } from '../../../../helpers';
import Gallery from '../../../../components/Gallery';
// import Gallery from '../../../../components/Gallery/GalleryClient';

const lang = 'uk';
const allowedPages = [
  {
    page_number: '1',
  },
  {
    page_number: '2',
  },
  {
    page_number: '3',
  },
  {
    page_number: '4',
  }
];


export async function generateStaticParams() {
  return [
    {
      page_number: '1',
    },
    {
      page_number: '2',
    },
    {
      page_number: '3',
    },
    {
      page_number: '4',
    }
  ];
}

export async function generateMetadata({ params }) {
  const currentPage = +params.page_number;
  const is404 = is404Page(currentPage, allowedPages);

  if (is404) {
    return generate404MetaData();
  }

  const title = 'Срібні сережки | Купити срібні кульчики Daisy Jewellery';
  const description = 'Срібні сережки Daisy Jewellery. Отримуйте замовлення без затримок по Україні! Ціни, що вас приємно здивують';
  const lastPage = 4;
  const categorySlug = 'serezhky';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage}`;
  const keywords = 'Срібні сережки, купити';

  const categoryMetadata = generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords, lang });

  return categoryMetadata;
}

export default async function CategoryPageNumber({ params }) {
  const baseURL = `/${lang}/serezhky`;
  const itemBaseURL = `${baseURL}/kupyty-serezhky-sribni`;
  const paginated = true;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const { products, hasMore } = await fetchProduct({ offset, limit, categoryId: process.env.EARING_CATEGORY_ID, paginated });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';

  if (!products || !products.length) {
    return notFound();
  }

  const logoJsonLd = getLogoJsonLd();
  const categoryJsonLd = getCategoryJsonLd({
    categoryName: 'Срібні сережки від Daisy Jewellery',
    categoryDescription: 'Срібні сережки Daisy Jewellery. Отримуйте замовлення без затримок по Україні! Ціни, що вас приємно здивують',
    url: `${baseURL}/${params.page_number}`,
    lowPrice: 650,
    highPrice: 1700
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
        withPagination={paginated}
        isMobile={isMobile}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }}
      />
    </>
  );
}
