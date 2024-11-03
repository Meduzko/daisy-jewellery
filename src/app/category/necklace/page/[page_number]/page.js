import { fetchProduct } from '../../../../../actions/fetchProduct';
import { getPaginationData } from '../../../../../helpers';
import Gallery from '../../../../../components/Gallery';
import { getDeviceType } from '../../../../../helpers/index';

export default async function CategoryPageNumber({ params }) {
  const baseURL = '/category/necklace';
  const categoryId = process.env.NECKLACE_CATEGORY_ID;
  const paginated = true;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const { products, hasMore } = await fetchProduct({ offset, limit, categoryId, paginated });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';

  return <Gallery
    items={products}
    hasMore={hasMore}
    currentPage={currentPage}
    baseURL={baseURL}
    withPagination={paginated}
    isMobile={isMobile}
  />;
}
