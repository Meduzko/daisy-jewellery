import { fetchProduct } from '../../../../actions/fetchProduct';
import { getTranslations, getCategoryTranslations } from '../../../../dictionaries';
import { getLogoJsonLd, getCategoryJsonLd } from '../../../../helpers/getJsonLd';
// import { fetchAllProducts } from '../../../actions/fetchAllProducts';
import { getPaginationData, getDeviceType, generateCategoryMetadata } from '../../../../helpers';
import Gallery from '../../../../components/Gallery';
import { notFound } from 'next/navigation';

const lang = 'ru';

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
  const title = 'Кольца серебряные | Купить серебряные кольца Daisy Jewellery';
  const description = 'Изысканные серебряные кольца от Daisy Jewellery. Быстрая доставка по всей Украине! Серебряные кольца по лучшей цене от производителя';
  const currentPage = +params.page_number;
  const lastPage = 3;
  const categorySlug = 'koltsa';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${categorySlug}/${currentPage}`;
  const keywords = 'Серебряные кольца, купить';

  const categoryMetadata = generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords, lang });

  return categoryMetadata;
}

export default async function Page({ params }) {
  const baseURL = `/${lang}/koltsa`;
  const itemBaseURL = `${baseURL}/kupit-serebryanoye-koltso`;
  const categoryId = process.env.RING_CATEGORY_ID;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const paginated = true;
  const { products, hasMore } = await fetchProduct({ offset, limit, categoryId, paginated });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';
  const tk = await getCategoryTranslations({ lang: 'ru', categoryName: 'koltsa' });

  if (!products || !products.length) {
    notFound();
  }

  const logoJsonLd = getLogoJsonLd({ lang: 'ru' });
  const categoryJsonLd = getCategoryJsonLd({
    categoryName: 'Серебряные кольца от Daisy Jewellery.',
    categoryDescription: 'Изысканные серебряные кольца от Daisy Jewellery. Быстрая доставка по всей Украине!',
    url: `${baseURL}/${params.page_number}`,
    lowPrice: 500,
    highPrice: 1400
  });

  return (
    <>
      <h1 className="category-title">Кольца серебряные</h1>
      <Gallery
        items={products}
        hasMore={hasMore}
        currentPage={currentPage}
        baseURL={baseURL}
        itemBaseURL={itemBaseURL}
        withPagination={paginated}
        isMobile={isMobile}
        t={tk}
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
