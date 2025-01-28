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
    }
  ];
}

export async function generateMetadata({ params }) {
  const title = 'Серебряные браслеты | Купить серебряный браслет Daisy Jewellery';
  const description = 'Серебряные браслеты от Daisy Jewellery. Доставка в любой уголок Украины. Купить серебряный браслет от производителя по лучшей цене';
  const currentPage = +params.page_number;
  const lastPage = 2;
  const categorySlug = 'braslety';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage}`;
  const keywords = 'Серебряные браслеты, купить';

  const categoryMetadata = generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords, lang });

  return categoryMetadata;
}

export default async function CategoryPageNumber({ params }) {
  const baseURL = `/${lang}/braslety`;
  const itemBaseURL = `${baseURL}/kupit-serebryanyy-braslet`;
  const paginated = true;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const { products, hasMore } = await fetchProduct({ offset, limit, categoryId: process.env.BRACER_CATEGORY_ID, paginated });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';
  const tk = await getCategoryTranslations({ lang: 'ru', categoryName: 'braslety' });

  if (!products || !products.length) {
    notFound();
  }

  const logoJsonLd = getLogoJsonLd({ lang: 'ru' });
  const categoryJsonLd = getCategoryJsonLd({
    categoryName: 'Серебряные браслеты от Daisy Jewellery',
    categoryDescription: 'Серебряные браслеты от Daisy Jewellery. Доставка в любой уголок Украины. Купить серебряный браслет от производителя по лучшей цене',
    url: `${baseURL}/${params.page_number}`,
    lowPrice: 650,
    highPrice: 5400
  });

  return (
    <>
      <h1 className="category-title">Серебряные браслеты</h1>
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
