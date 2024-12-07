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
  const title = 'Срібні браслети';
  const description = 'Срібні браслети';
  const currentPage = +params.page_number;
  const categorySlug = 'braslety';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${categorySlug}/${currentPage}`;
  const keywords = 'Срібні браслети, купити';

  const categoryMetadata = generateCategoryMetadata({ title, description, currentPage, canonicalUrl, categorySlug, keywords });

  return categoryMetadata;
}

export default async function CategoryPageNumber({ params }) {
  const baseURL = '/braslety';
  const itemBaseURL = `${baseURL}/kupyty-sribnyy-braslet`;
  const paginated = true;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const { products, hasMore } = await fetchProduct({ offset, limit, categoryId: process.env.BRACER_CATEGORY_ID, paginated });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';

  return <Gallery
    items={products}
    hasMore={hasMore}
    currentPage={currentPage}
    baseURL={baseURL}
    itemBaseURL={itemBaseURL}
    withPagination={paginated}
    isMobile={isMobile}
  />;
}
