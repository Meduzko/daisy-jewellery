import { notFound } from 'next/navigation';
import { fetchProduct } from '../../../actions/fetchProduct';
import {
  getPaginationData,
  getDeviceType,
  generateCategoryMetadata,
} from '../../../helpers';
import Gallery from '../../../components/Gallery';

export async function generateStaticParams() {
  const staticPages = [
    {
      page_number: '1',
    },
    {
      page_number: '2',
    },
  ];

  return staticPages;
}

export async function generateMetadata({ params }) {
  const title = 'Срібні Кольє | Купити срібне кольє Daisy Jewellery';
  const description =
    'Купити срібні кольє Daisy Jewellery. Доставка в найкоротші терміни по Україні! Найкраща ціна на ринку від виробника';
  const currentPage = +params.page_number;
  const lastPage = 2;
  const categorySlug = 'kolye';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${categorySlug}/${currentPage}`;
  const keywords = 'Срібні кольє, купити';

  const categoryMetadata = generateCategoryMetadata({
    title,
    description,
    currentPage,
    lastPage,
    canonicalUrl,
    categorySlug,
    keywords,
  });

  return categoryMetadata;
}

export default async function CategoryPageNumber({ params }) {
  const baseURL = '/kolye';
  const itemBaseURL = `${baseURL}/kupyty-sribne-kolye`;
  const categoryId = process.env.NECKLACE_CATEGORY_ID;
  const paginated = true;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const { products, hasMore } = await fetchProduct({
    offset,
    limit,
    categoryId,
    paginated,
  });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';

  if (!products || !products.length) {
    notFound();
  }

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
    </>
  );
}
