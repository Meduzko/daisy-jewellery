import { fetchProduct } from '../../../../actions/fetchProduct';
import { getLogoJsonLd, getCategoryJsonLd } from '../../../../helpers/getJsonLd';
import { getPaginationData, getDeviceType, generateCategoryMetadata, is404Page, generate404MetaData } from '../../../../helpers';
import Gallery from '../../../../components/Gallery';
import { notFound } from 'next/navigation';
import { getCategoryTranslations } from '../../../../dictionaries';

const allowedPages = [
  { page_number: '1' },
  { page_number: '2' },
  { page_number: '3' },
];

export async function generateStaticParams() {
  // sergi is the Russian slug - only generate ru pages
  const pages = allowedPages.map(p => p.page_number);
  return pages.map(page_number => ({ lang: 'ru', page_number }));
}

export async function generateMetadata({ params }) {
  const lang = 'ru';
  const currentPage = +params.page_number;
  const is404 = is404Page(currentPage, allowedPages);
  if (is404) return generate404MetaData();

  const title = 'Серебряные серьги | Купить серебряные серьги Daisy Jewellery';
  const description = 'Серебряные серьги от Daisy Jewellery. Быстрая доставка по всей Украине!';
  const categorySlug = 'sergi';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage}`;
  const keywords = 'Серебряные серьги, купить';
  const lastPage = 3;
  return generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords, lang });
}

export default async function Page({ params }) {
  const lang = 'ru';
  const baseSlug = 'sergi';
  const itemSlug = 'kupit-serebryanyye-sergi';
  const baseURL = `/${lang}/${baseSlug}`;
  const itemBaseURL = `${baseURL}/${itemSlug}`;
  const categoryId = process.env.EARING_CATEGORY_ID;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const paginated = true;
  const { products, hasMore } = await fetchProduct({ offset, limit, categoryId, paginated });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';
  const tk = await getCategoryTranslations({ lang, categoryName: 'sergi' }).catch(() => undefined);

  if (!products || !products.length) notFound();

  const logoJsonLd = getLogoJsonLd({ lang });
  const categoryJsonLd = getCategoryJsonLd({
    categoryName: 'Серебряные серьги от Daisy Jewellery',
    categoryDescription: 'Серебряные серьги от Daisy Jewellery. Быстрая доставка по всей Украине!',
    url: `${baseURL}/${params.page_number}`,
    lowPrice: 400,
    highPrice: 2200
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
        lang={lang}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categoryJsonLd) }} />
    </>
  );
}
