import { fetchProduct } from '../../../actions/fetchProduct';
import { getPaginationData, getDeviceType, generateCategoryMetadata } from '../../../helpers';
import Gallery from '../../../components/Gallery';
import { notFound } from 'next/navigation';

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
  ]

  return staticPages;
}

export async function generateMetadata({ params }) {
  const title = 'Срібні сережки | Купити срібні кульчики Daisy Jewellery';
  const description = 'Срібні сережки Daisy Jewellery. Отримуйте замовлення без затримок по Україні! Ціни, що вас приємно здивують';
  const currentPage = +params.page_number;
  const lastPage = 3;
  const categorySlug = 'serezhky';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${categorySlug}/${currentPage}`;
  const keywords = 'Срібні сережки, купити';

  const categoryMetadata = generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords });

  return categoryMetadata;
}

export default async function CategoryPageNumber({ params }) {
  const baseURL = '/serezhky';
  const itemBaseURL = `${baseURL}/kupyty-serezhky-sribni`;
  const paginated = true;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const { products, hasMore } = await fetchProduct({ offset, limit, categoryId: process.env.EARING_CATEGORY_ID, paginated });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';

  if (!products || !products.length) {
    notFound();
  }

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
    </>
  );
}
