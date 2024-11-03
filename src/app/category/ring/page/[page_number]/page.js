// import { fetchProducts } from '../../../../../actions/fetchProducts';
import { fetchProduct } from '../../../../../actions/fetchProduct';
// import { getPaginationData } from '../../../../../helpers';
import { getPaginationData } from '../../../../../helpers';
import Gallery from '../../../../../components/Gallery';
import { getDeviceType } from '../../../../../helpers/index';

// export async function generateStaticParams() {
//   // const posts = await fetch('https://.../posts').then((res) => res.json());
//   const categoryId = process.env.RING_CATEGORY_ID;
//   const products = await fetchAllProducts({ categoryId });

//   return products.map((product) => ({
//     code: product.code,
//   }))
// }

export default async function Page({ params }) {
  const baseURL = '/category/ring';
  const categoryId = process.env.RING_CATEGORY_ID;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const paginated = true;
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
