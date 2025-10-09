import { fetchProduct } from '../../../../actions/fetchProduct';
import { getLogoJsonLd, getCategoryJsonLd } from '../../../../helpers/getJsonLd';
import { getPaginationData, getDeviceType, generateCategoryMetadata, is404Page, generate404MetaData } from '../../../../helpers';
import Gallery from '../../../../components/Gallery';
import { notFound } from 'next/navigation';

const allowedPages = [
  { page_number: '1' },
  { page_number: '2' },
  { page_number: '3' },
];

export async function generateStaticParams() {
  const langs = ['uk', 'ru'];
  const pages = allowedPages.map(p => p.page_number);
  return langs.flatMap(lang => pages.map(page_number => ({ lang, page_number })));
}

export async function generateMetadata({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const currentPage = +params.page_number;
  const is404 = is404Page(currentPage, allowedPages);
  if (is404) return generate404MetaData();

  const title = lang === 'ru'
    ? 'Серебряные колье | Купить серебряное колье Daisy Jewellery'
    : 'Срібні кольє | Купити срібне кольє Daisy Jewellery';
  const description = lang === 'ru'
    ? 'Серебряные колье от Daisy Jewellery. Быстрая доставка по всей Украине!'
    : 'Срібні кольє від Daisy Jewellery. Швидка доставка по всій Україні!';
  const categorySlug = 'kolye';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage}`;
  const keywords = lang === 'ru' ? 'Серебряные колье, купить' : 'Срібні кольє, купити';
  const lastPage = 3;
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
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }} />
    </>
  );
}


