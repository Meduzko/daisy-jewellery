import { fetchProduct } from '../../../../actions/fetchProduct';
import { getLogoJsonLd, getCategoryJsonLd } from '../../../../helpers/getJsonLd';
// import { fetchAllProducts } from '../../../actions/fetchAllProducts';
import { getPaginationData, getDeviceType, generateCategoryMetadata, is404Page, generate404MetaData } from '../../../../helpers';
import Gallery from '../../../../components/Gallery';
// import Gallery from '../../../../components/Gallery/GalleryClient';
import { notFound } from 'next/navigation';

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
  },
  {
    page_number: '5',
  }
];

// TODO
export async function generateStaticParams() {
  // const posts = await fetch('https://.../posts').then((res) => res.json());
  // const categoryId = process.env.RING_CATEGORY_ID;
  // const products = await fetchAllProducts({ categoryId });

  // return products.map((product) => ({
  //   page_number: product.code,
  // }))

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

  const title = 'Каблучки срібні | Купити срібні кільця Daisy Jewellery';
  const description = 'Вишукані срібні каблучки від Daisy Jewellery. Швидка доставка по всій Україні! Срібні кольца за найкращою ціною від виробника';
  const lastPage = 4;
  const categorySlug = 'kabluchki';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage}`;
  const keywords = 'Срібні каблучки, купити';

  const categoryMetadata = generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords, lang });

  return categoryMetadata;
}

export default async function Page({ params }) {
  const baseURL = `/${lang}/kabluchki`;
  const itemBaseURL = `${baseURL}/kupyty-sribnu-kabluchku`;
  const categoryId = process.env.RING_CATEGORY_ID;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const paginated = true;
  // const { products, hasMore } = await fetchProduct({ offset, limit, categoryId, paginated });
  const data = await fetchProduct({ offset, limit, categoryId, paginated });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';


  if (!data || !data?.products || !data?.products?.length) {
    notFound();
  }

  const { products, hasMore} = data;
  const logoJsonLd = getLogoJsonLd();
  const categoryJsonLd = getCategoryJsonLd({
    categoryName: 'Срібні каблучки від Daisy Jewellery.',
    categoryDescription: 'Вишукані срібні каблучки від Daisy Jewellery. Швидка доставка по всій Україні!',
    url: `${baseURL}/${params.page_number}`,
    lowPrice: 500,
    highPrice: 1400
  });

  return (
    <>
      <h1 className="category-title">Каблучки срібні</h1>
      <Gallery
        items={products}
        hasMore={hasMore}
        currentPage={currentPage}
        baseURL={baseURL}
        itemBaseURL={itemBaseURL}
        withPagination={paginated}
        isMobile={isMobile}
        showSizes={true}
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
