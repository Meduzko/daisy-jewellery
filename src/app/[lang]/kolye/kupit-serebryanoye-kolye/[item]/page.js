export const revalidate = 900;
import Breadcrumbs from '../../../../../components/Breadcrumbs';
import ProductPageNew from '../../../../../components/ProductPage';
import { fetchProduct } from '../../../../../actions/fetchProduct';
import { fetchAllProducts } from '../../../../../actions/fetchAllProducts';
import { getProductMetadata } from '../../../../../helpers';
import { getProductJsonLd, getLogoJsonLd } from '../../../../../helpers/getJsonLd';
import { notFound } from 'next/navigation';
import { getItemTranslations } from '../../../../../dictionaries';

export async function generateMetadata({ params }) {
  if (!params?.item) return notFound();
  const response = await fetchProduct({ 
    code: params.item, 
    categoryId: process.env.NECKLACE_CATEGORY_ID,
    throwOnError: true
  });
  if (!response || response?.length === 0) return notFound();
  const [product] = response;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  return getProductMetadata({ product, categoryName: 'kolye', lang });
}

export async function generateStaticParams() {
  try {
    const products = await fetchAllProducts({ categoryId: process.env.NECKLACE_CATEGORY_ID });
    if (!products || !products?.length) return [];
    return products.map(product => ({ lang: 'ru', item: product.code.toString() }));
  } catch (e) {
    console.error('Error in generateStaticParams:', e);
    return [];
  }
}

export default async function NecklaceItem({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const products = await fetchProduct({ 
    code: params.item, 
    categoryId: process.env.NECKLACE_CATEGORY_ID,
    throwOnError: true
  });
  const [product] = products;
  if (!product) return notFound();

  const productJsonLd = await getProductJsonLd(product, lang === 'ru' ? 'kolye/kupit-serebryanoye-kolye' : 'kolye/kupyty-sribne-kolye', { categoryName: 'kolye', lang });
  const logoJsonLd = getLogoJsonLd({ lang });
  const t = await getItemTranslations({ lang, categoryName: 'kolye', code: product.code }).catch(() => undefined);

  const segments = [
    { name: lang === 'ru' ? 'Главная' : 'Головна', href: `/${lang}` },
    { name: lang === 'ru' ? 'Колье' : 'Кольє', href: `/${lang}/kolye/1` },
    { name: t?.title || product?.title, href: `/${lang}/${lang === 'ru' ? 'kolye/kupit-serebryanoye-kolye' : 'kolye/kupyty-sribne-kolye'}/${params.item}` },
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      <ProductPageNew item={product} t={t} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }} />
    </>
  );
}


