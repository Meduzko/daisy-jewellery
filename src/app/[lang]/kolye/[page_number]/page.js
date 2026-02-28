import { fetchProduct } from '../../../../actions/fetchProduct';
import { fetchAllProducts } from '../../../../actions/fetchAllProducts';
import { getLogoJsonLd, getCategoryJsonLd } from '../../../../helpers/getJsonLd';
import { getPaginationData, getDeviceType, generateCategoryMetadata, generate404MetaData } from '../../../../helpers';
import Gallery from '../../../../components/Gallery';
import { notFound } from 'next/navigation';
import { getCategoryTranslations } from '../../../../dictionaries';

const ITEMS_PER_PAGE = 16;

async function getTotalPages() {
  const products = await fetchAllProducts({ categoryId: process.env.NECKLACE_CATEGORY_ID });
  if (!products || !products.length) return 1;
  return Math.ceil(products.length / ITEMS_PER_PAGE);
}

export async function generateStaticParams() {
  const totalPages = await getTotalPages();
  const langs = ['uk', 'ru'];
  const pages = Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
  return langs.flatMap(lang => pages.map(page_number => ({ lang, page_number })));
}

export async function generateMetadata({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const currentPage = +params.page_number;
  const totalPages = await getTotalPages();

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
  const categoryId = process.env.NECKLACE_CATEGORY_ID;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const paginated = true;
  const { products, hasMore } = await fetchProduct({ offset, limit, categoryId, paginated });
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
        withPagination={paginated}
        isMobile={isMobile}
        t={tk}
        lang={lang}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }} />
    </>
  );
}


