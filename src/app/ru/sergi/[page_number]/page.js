import { notFound } from 'next/navigation';
import { getCategoryTranslations } from '../../../../dictionaries';
import { getLogoJsonLd, getCategoryJsonLd } from '../../../../helpers/getJsonLd';
import { fetchProduct } from '../../../../actions/fetchProduct';
import { getPaginationData, getDeviceType, generateCategoryMetadata } from '../../../../helpers';
import Gallery from '../../../../components/Gallery';

const lang = 'ru';

export async function generateStaticParams() {
  return [
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
}

export async function generateMetadata({ params }) {
  const title = 'Серебряные серьги | Купить серебряные серьги Daisy Jewellery';
  const description = 'Серебряные серьги Daisy Jewellery. Получайте заказы без задержек по Украине! Цены, которые вас приятно удивят';
  const currentPage = +params.page_number;
  const lastPage = 3;
  const categorySlug = 'sergi';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage}`;
  const keywords = 'Серебряные серьги, купить';

  const categoryMetadata = generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords, lang });

  return categoryMetadata;
}

export default async function CategoryPageNumber({ params }) {
  const baseURL = `/${lang}/sergi`;
  const itemBaseURL = `${baseURL}/kupit-serebryanyye-sergi`;
  const paginated = true;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const { products, hasMore } = await fetchProduct({ offset, limit, categoryId: process.env.EARING_CATEGORY_ID, paginated });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';
  const tk = await getCategoryTranslations({ lang: 'ru', categoryName: 'sergi' });

  if (!products || !products.length) {
    notFound();
  }

  const logoJsonLd = getLogoJsonLd({ lang: 'ru' });
  const categoryJsonLd = getCategoryJsonLd({
    categoryName: 'Серебряные серьги от Daisy Jewellery',
    categoryDescription: 'Серебряные серьги Daisy Jewellery. Получайте заказы без задержек по Украине! Цены, которые вас приятно удивят',
    url: `${baseURL}/${params.page_number}`,
    lowPrice: 650,
    highPrice: 1700
  });

  return (
    <>
      <h1 className="category-title">Серебряные серьги</h1>
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
