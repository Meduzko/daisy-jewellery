import { getLogoJsonLd, getCategoryJsonLd } from '../../../../helpers/getJsonLd';
import { getPaginationData, getDeviceType, generateCategoryMetadata, generate404MetaData } from '../../../../helpers';
import { getCachedTotalPages, getCachedProducts } from '../../../../lib/dataCache';
import Gallery from '../../../../components/Gallery';
import { notFound } from 'next/navigation';
import { getCategoryTranslations } from '../../../../dictionaries';

const ITEMS_PER_PAGE = 16;
const CATEGORY_ID = process.env.NECKLACE_CATEGORY_ID;

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
    ? 'Серебряные колье | Купить серебряное колье Daisy Jewellery'
    : 'Срібні кольє | Купити срібне кольє Daisy Jewellery';
  const description = lang === 'ru'
    ? 'Серебряные колье от Daisy Jewellery. Быстрая доставка по всей Украине!'
    : 'Срібні кольє від Daisy Jewellery. Швидка доставка по всій Україні!';
  const categorySlug = 'kolye';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage}`;
  const keywords = lang === 'ru' ? 'Серебряные колье, купить' : 'Срібні кольє, купити';
  const lastPage = totalPages;
  return generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords, lang });
}

export default async function Page({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const baseURL = `/${lang}/kolye`;
  const itemBaseURL = `${baseURL}/${lang === 'ru' ? 'kupit-serebryanoye-kolye' : 'kupyty-sribne-kolye'}`;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const { products, hasMore } = await getCachedProducts({ categoryId: CATEGORY_ID, offset, limit });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';
  const tk = await getCategoryTranslations({ lang, categoryName: lang === 'ru' ? 'kolye' : '' }).catch(() => undefined);

  if (!products || !products.length) notFound();

  const logoJsonLd = getLogoJsonLd({ lang });
  const categoryJsonLd = getCategoryJsonLd({
    categoryName: lang === 'ru' ? 'Серебряные колье от Daisy Jewellery' : 'Срібні кольє від Daisy Jewellery',
    categoryDescription: lang === 'ru' ? 'Серебряные колье от Daisy Jewellery. Быстрая доставка по всей Украине!' : 'Срібні кольє від Daisy Jewellery. Швидка доставка по всій Україні!',
    url: `${baseURL}/${params.page_number}`,
    lowPrice: 500,
    highPrice: 2800
  });

  return (
    <>
      <h1 className="category-title">{lang === 'ru' ? 'Серебряные колье' : 'Срібні кольє'}</h1>
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }} />
    </>
  );
}


