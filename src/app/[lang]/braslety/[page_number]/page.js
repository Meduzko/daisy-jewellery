import { notFound } from 'next/navigation';
import { getLogoJsonLd, getCategoryJsonLd } from '../../../../helpers/getJsonLd';
import { getPaginationData, getDeviceType, generateCategoryMetadata, generate404MetaData } from '../../../../helpers';
import { getCachedTotalPages, getCachedProducts } from '../../../../lib/dataCache';
import Gallery from '../../../../components/Gallery';
import { getCategoryTranslations } from '../../../../dictionaries';

const ITEMS_PER_PAGE = 16;
const CATEGORY_ID = process.env.BRACER_CATEGORY_ID;

export async function generateStaticParams() {
  const totalPages = await getCachedTotalPages(CATEGORY_ID, ITEMS_PER_PAGE);
  const langs = ['uk', 'ru'];
  const pages = Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
  return langs.flatMap(lang => pages.map(page_number => ({ lang, page_number })));
}

export async function generateMetadata({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const currentPage = +params.page_number;
  const totalPages = await getCachedTotalPages(CATEGORY_ID, ITEMS_PER_PAGE);

  if (isNaN(currentPage) || currentPage < 1 || currentPage > totalPages) {
    return generate404MetaData();
  }

  const title = lang === 'ru'
    ? 'Серебряные браслеты | Купить серебряный браслет Daisy Jewellery'
    : 'Срібні браслети | Купити срібний браслет Daisy Jewellery';

  const description = lang === 'ru'
    ? 'Серебряные браслеты от Daisy Jewellery. Доставка по всей Украине. Купить серебряный браслет от производителя по лучшей цене'
    : 'Срібні браслети від Daisy Jewellery. Доставка в будь який куточок України. Купити срібний браслет від виробника за найкращою ціною';

  const lastPage = totalPages;
  const categorySlug = 'braslety';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage}`;
  const keywords = lang === 'ru' ? 'Серебряные браслеты, купить' : 'Срібні браслети, купити';

  return generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords, lang });
}

export default async function CategoryPageNumber({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const baseURL = `/${lang}/braslety`;
  const itemBaseURL = `${baseURL}/${lang === 'ru' ? 'kupit-serebryanyy-braslet' : 'kupyty-sribnyy-braslet'}`;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const { products, hasMore } = await getCachedProducts({ categoryId: CATEGORY_ID, offset, limit });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';
  const tk = await getCategoryTranslations({ lang, categoryName: lang === 'ru' ? 'braslety' : '' }).catch(() => undefined);

  if (!products || !products.length) {
    notFound();
  }

  const logoJsonLd = getLogoJsonLd({ lang });
  const categoryJsonLd = getCategoryJsonLd({
    categoryName: lang === 'ru' ? 'Серебряные браслеты от Daisy Jewellery' : 'Срібні браслети від Daisy Jewellery',
    categoryDescription: lang === 'ru'
      ? 'Серебряные браслеты от Daisy Jewellery. Доставка по всей Украине. Купить серебряный браслет от производителя по лучшей цене'
      : 'Срібні браслети від Daisy Jewellery. Доставка в будь який куточок України. Купити срібний браслет від виробника за найкращою ціною',
    url: `${baseURL}/${params.page_number}`,
    lowPrice: 650,
    highPrice: 5400
  });

  return (
    <>
      <h1 className="category-title">{lang === 'ru' ? 'Серебряные браслеты' : 'Срібні браслети'}</h1>
      <Gallery
        items={products}
        hasMore={hasMore}
        currentPage={currentPage}
        baseURL={baseURL}
        itemBaseURL={itemBaseURL}
        withPagination={true}
        isMobile={isMobile}
        t={tk}
        lang={lang}
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


