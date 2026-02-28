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
    categoryId: process.env.EARING_CATEGORY_ID,
    throwOnError: true
  });
  if (!response || response?.length === 0) return notFound();
  const [product] = response;
  const lang = 'ru';
  return getProductMetadata({ product, categoryName: 'sergi', lang });
}

export async function generateStaticParams() {
  try {
    const products = await fetchAllProducts({ categoryId: process.env.EARING_CATEGORY_ID });
    if (!products || !products?.length) return [];
    // sergi/kupit-serebryanyye-sergi is Russian - only generate ru pages
    return products.map(product => ({ lang: 'ru', item: product.code.toString() }));
  } catch (e) {
    console.error('Error in RU earrings generateStaticParams:', e);
    return [];
  }
}

export default async function EarringsItem({ params }) {
  const lang = 'ru';
  const products = await fetchProduct({ 
    code: params.item, 
    categoryId: process.env.EARING_CATEGORY_ID,
    throwOnError: true
  });
  const [product] = products;
  if (!product) return notFound();

  const categorySlug = 'sergi';
  const productSlug = 'kupit-serebryanyye-sergi';
  
  const productJsonLd = await getProductJsonLd(product, `${categorySlug}/${productSlug}`, { categoryName: categorySlug, lang });
  const logoJsonLd = getLogoJsonLd({ lang });
  const t = await getItemTranslations({ lang, categoryName: categorySlug, code: product.code }).catch(() => undefined);

  const segments = [
    { name: 'Главная', href: `/${lang}` },
    { name: 'Серьги', href: `/${lang}/${categorySlug}/1` },
    { name: t?.title || product?.title, href: `/${lang}/${categorySlug}/${productSlug}/${params.item}` },
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
