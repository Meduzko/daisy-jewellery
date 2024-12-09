import { fetchProduct } from '../../../actions/fetchProduct';
// import { fetchAllProducts } from '../../../actions/fetchAllProducts';
import { getPaginationData, getDeviceType, generateCategoryMetadata } from '../../../helpers';
import Gallery from '../../../components/Gallery';
import { notFound } from 'next/navigation';

// TODO
export async function generateStaticParams() {
  // const posts = await fetch('https://.../posts').then((res) => res.json());
  // const categoryId = process.env.RING_CATEGORY_ID;
  // const products = await fetchAllProducts({ categoryId });

  // return products.map((product) => ({
  //   page_number: product.code,
  // }))

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
  const title = 'Каблучки срібні | Купити срібні кільця Daisy Jewellery';
  const description = 'Вишукані срібні каблучки від Daisy Jewellery. Швидка доставка по всій Україні! Срібні кольца за найкращою ціною від виробника';
  const currentPage = +params.page_number;
  const lastPage = 3;
  const categorySlug = 'kabluchki';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${categorySlug}/${currentPage}`;
  const keywords = 'Срібні каблучки, купити';

  const categoryMetadata = generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords });

  return categoryMetadata;
}

export default async function Page({ params }) {
  const baseURL = '/kabluchki';
  const itemBaseURL = `${baseURL}/kupyty-sribnu-kabluchku`;
  const categoryId = process.env.RING_CATEGORY_ID;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const paginated = true;
  const { products, hasMore } = await fetchProduct({ offset, limit, categoryId, paginated });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';


  if (!products || !products.length) {
    notFound();
  }

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
