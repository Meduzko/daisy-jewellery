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
  }
];

export async function generateStaticParams() {
  const staticPages = [
    {
      page_number: '1',
    },
    {
      page_number: '2',
    },
    {
      page_number: '3',
    }
  ];

  return staticPages;
}

export async function generateMetadata({ params }) {
  const currentPage = +params.page_number;
  const is404 = is404Page(currentPage, allowedPages);

  if (is404) {
    return generate404MetaData();
  }

  const title = 'Срібні Кольє | Купити срібне кольє Daisy Jewellery';
  const description = 'Купити срібні кольє Daisy Jewellery. Доставка в найкоротші терміни по Україні! Найкраща ціна на ринку від виробника';
  const lastPage = 3;
  const categorySlug = 'kolye';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage}`;
  const keywords = 'Срібні кольє, купити';

  const categoryMetadata = generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords, lang });

  return categoryMetadata;
}

export default async function CategoryPageNumber({ params }) {
  const baseURL = `/${lang}/kolye`;
  const itemBaseURL = `${baseURL}/kupyty-sribne-kolye`;
  const categoryId = process.env.NECKLACE_CATEGORY_ID;
  const paginated = true;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const { products, hasMore } = await fetchProduct({ offset, limit, categoryId, paginated });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';

  if (!products || !products.length) {
    notFound();
  }

  const logoJsonLd = getLogoJsonLd();
  const categoryJsonLd = getCategoryJsonLd({
    categoryName: 'Срібні кольє від Daisy Jewellery',
    categoryDescription: 'Купити срібні кольє Daisy Jewellery. Доставка в найкоротші терміни по Україні! Найкраща ціна на ринку від виробника',
    url: `${baseURL}/${params.page_number}`,
    lowPrice: 650,
    highPrice: 1600
  });

  return (
    <>
      <h1 className="category-title">Срібні кольє</h1>
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
