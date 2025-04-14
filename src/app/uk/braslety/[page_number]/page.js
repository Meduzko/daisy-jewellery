import { notFound } from 'next/navigation';
import { getLogoJsonLd, getCategoryJsonLd } from '../../../../helpers/getJsonLd';
import { fetchProduct } from '../../../../actions/fetchProduct';
import { getPaginationData, getDeviceType, generateCategoryMetadata, is404Page, generate404MetaData } from '../../../../helpers';
// import Gallery from '../../../../components/Gallery';
import Gallery from '../../../../components/Gallery/GalleryClient';

const lang = 'uk';
const allowedPages = [
  {
    page_number: '1',
  },
  {
    page_number: '2',
  }
];

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
  const currentPage = +params.page_number;
  const is404 = is404Page(currentPage, allowedPages);

  if (is404) {
    return generate404MetaData();
  }

  const title = 'Срібні браслети | Купити срібний браслет Daisy Jewellery';
  const description = 'Срібні браслети від Daisy Jewellery. Доставка в будь який куточок України. Купити срібний браслет від виробника за найкращою ціною';
  const lastPage = 2;
  const categorySlug = 'braslety';
  const canonicalUrl = `${process.env.SITE_DOMAIN}/${lang}/${categorySlug}/${currentPage}`;
  const keywords = 'Срібні браслети, купити';

  const categoryMetadata = generateCategoryMetadata({ title, description, currentPage, lastPage, canonicalUrl, categorySlug, keywords, lang });

  return categoryMetadata;
}

export default async function CategoryPageNumber({ params }) {
  const baseURL = `/${lang}/braslety`;
  const itemBaseURL = `${baseURL}/kupyty-sribnyy-braslet`;
  const paginated = true;
  const { currentPage, limit, offset } = getPaginationData(params.page_number);
  const { products, hasMore } = await fetchProduct({ offset, limit, categoryId: process.env.BRACER_CATEGORY_ID, paginated });
  const device = getDeviceType();
  const isMobile = device !== 'desktop';

  if (!products || !products.length) {
    notFound();
  }

  const logoJsonLd = getLogoJsonLd();
  const categoryJsonLd = getCategoryJsonLd({
    categoryName: 'Срібні браслети від Daisy Jewellery',
    categoryDescription: 'Срібні браслети від Daisy Jewellery. Доставка в будь який куточок України. Купити срібний браслет від виробника за найкращою ціною',
    url: `${baseURL}/${params.page_number}`,
    lowPrice: 650,
    highPrice: 5400
  });

  return (
    <>
      <h1 className="category-title">Срібні браслети</h1>
      <Gallery
        items={products}
        hasMore={hasMore}
        currentPage={currentPage}
        baseURL={baseURL}
        itemBaseURL={itemBaseURL}
        withPagination={paginated}
        isMobile={isMobile}
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
