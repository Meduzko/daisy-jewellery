import { notFound } from 'next/navigation';
import { getLogoJsonLd, getCategoryJsonLd } from '../../../helpers/getJsonLd';
import { fetchProduct } from '../../../actions/fetchProduct';
import { getPaginationData, getDeviceType, generateCategoryMetadata } from '../../../helpers';
import Gallery from '../../../components/Gallery';

export async function generateStaticParams() {
  const staticPages = [
    {
      page_number: '1',
    },
    {
      page_number: '2',
    }
  ]

  return staticPages;
}

export async function generateMetadata({ params }) {
  const title = 'Срібні Кольє | Купити срібне кольє Daisy Jewellery';
  const description = 'Купити срібні кольє Daisy Jewellery. Доставка в найкоротші терміни по Україні! Найкраща ціна на ринку від виробника';
  const currentPage = +params.page_number;
  const lastPage = 2;
  const categorySlug = 'kolye';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${categorySlug}/${currentPage}`;
  const keywords = 'Срібні кольє, купити';

  const categoryMetadata = generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords });

  return categoryMetadata;
}

export default async function CategoryPageNumber({ params }) {
  const baseURL = '/kolye';
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
