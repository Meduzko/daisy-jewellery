import { getCategoryTranslations } from '../../../../dictionaries';
import { getLogoJsonLd, getCategoryJsonLd } from '../../../../helpers/getJsonLd';
import { getPaginationData, getDeviceType, generateCategoryMetadata, generate404MetaData } from '../../../../helpers';
import { getCachedTotalPages, getCachedProducts } from '../../../../lib/dataCache';
import Gallery from '../../../../components/Gallery';
import { notFound } from 'next/navigation';

const ITEMS_PER_PAGE = 16;
const CATEGORY_ID = process.env.RING_CATEGORY_ID;

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
    ? 'Кольца серебряные | Купить серебряные кольца Daisy Jewellery'
    : 'Каблучки срібні | Купити срібні кільця Daisy Jewellery';

  const description = lang === 'ru'
    ? 'Изысканные серебряные кольца от Daisy Jewellery. Быстрая доставка по всей Украине! Серебряные кольца по лучшей цене от производителя'
    : 'Вишукані срібні каблучки від Daisy Jewellery. Швидка доставка по всій Україні! Срібні кільця за найкращою ціною від виробника';

  const lastPage = totalPages;
  const categorySlug = lang === 'ru' ? 'koltsa' : 'kabluchki';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage}`;
  const keywords = lang === 'ru' ? 'Серебряные кольца, купить' : 'Срібні каблучки, купити';

  return generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords, lang });
}

export default async function Page({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const baseSlug = lang === 'ru' ? 'koltsa' : 'kabluchki';
  const itemSlug = lang === 'ru' ? 'kupit-serebryanoye-koltso' : 'kupyty-sribnu-kabluchku';
  const baseURL = `/${lang}/${baseSlug}`;
  const itemBaseURL = `${baseURL}/${itemSlug}`;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const { products, hasMore } = await getCachedProducts({ categoryId: CATEGORY_ID, offset, limit });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';
  const tk = await getCategoryTranslations({ lang, categoryName: lang === 'ru' ? 'koltsa' : 'ring' }).catch(() => undefined);

  if (!products || !products.length) {
    notFound();
  }

  const logoJsonLd = getLogoJsonLd({ lang });
  const categoryJsonLd = getCategoryJsonLd({
    categoryName: lang === 'ru' ? 'Серебряные кольца от Daisy Jewellery.' : 'Срібні каблучки від Daisy Jewellery.',
    categoryDescription: lang === 'ru'
      ? 'Изысканные серебряные кольца от Daisy Jewellery. Быстрая доставка по всей Украине!'
      : 'Вишукані срібні каблучки від Daisy Jewellery. Швидка доставка по всій Україні!',
    url: `${baseURL}/${params.page_number}`,
    lowPrice: 500,
    highPrice: 1400
  });

  return (
    <>
      <h1 className="category-title">{lang === 'ru' ? 'Кольца серебряные' : 'Каблучки срібні'}</h1>
      <Gallery
        items={products}
        hasMore={hasMore}
        currentPage={currentPage}
        baseURL={baseURL}
        itemBaseURL={itemBaseURL}
        withPagination={true}
        isMobile={isMobile}
        t={tk}
        showSizes={true}
        lang={lang}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }} />
    </>
  );
}


