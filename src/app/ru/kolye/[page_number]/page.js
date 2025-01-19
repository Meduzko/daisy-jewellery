import { notFound } from 'next/navigation';
import { getCategoryTranslations } from '../../../../dictionaries';
import { getLogoJsonLd, getCategoryJsonLd } from '../../../../helpers/getJsonLd';
import { fetchProduct } from '../../../../actions/fetchProduct';
import { getPaginationData, getDeviceType, generateCategoryMetadata } from '../../../../helpers';
import Gallery from '../../../../components/Gallery';

const lang = 'ru';
const staticPages = [
  {
    page_number: '1',
  },
  {
    page_number: '2',
  }
];

export async function generateStaticParams() {
  return staticPages;
}

export async function generateMetadata({ params }) {
  const title = 'Серебряные Колье | Купить серебряное колье Daisy Jewellery';
  const description = 'Купить серебряные колье Daisy Jewellery. Доставка в кратчайшие сроки по Украине! Лучшая цена на рынке от производителя';
  const currentPage = +params.page_number;
  const lastPage = staticPages.length;
  const categorySlug = 'kolye';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage}`;
  const keywords = 'Серебряные Колье, купити';

  const categoryMetadata = generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords, lang });

  return categoryMetadata;
}

export default async function CategoryPageNumber({ params }) {
  const baseURL = `/${lang}/kolye`;
  const itemBaseURL = `${baseURL}/kupit-serebryanoye-kolye`;
  const categoryId = process.env.NECKLACE_CATEGORY_ID;
  const paginated = true;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const { products, hasMore } = await fetchProduct({ offset, limit, categoryId, paginated });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';
  const tk = await getCategoryTranslations({ lang: 'ru', categoryName: 'kolye' });

  if (!products || !products.length) {
    notFound();
  }

  const logoJsonLd = getLogoJsonLd({ lang: 'ru' });
  const categoryJsonLd = getCategoryJsonLd({
    categoryName: 'Серебряные колье от Daisy Jewellery',
    categoryDescription: 'Купить серебряные колье Daisy Jewellery. Доставка в кратчайшие сроки по Украине! Лучшая цена на рынке от производителя',
    url: `${baseURL}/${params.page_number}`,
    lowPrice: 650,
    highPrice: 1600
  });

  return (
    <>
      <h1 className="category-title">Серебряные колье</h1>
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
