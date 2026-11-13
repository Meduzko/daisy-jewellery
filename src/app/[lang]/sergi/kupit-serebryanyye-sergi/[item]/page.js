export const revalidate = 900;
import ProductPageNew from '../../../../../components/ProductPage';
import { getCachedAllProducts, getCachedProductByCode } from '../../../../../lib/dataCache';
import { getProductMetadata } from '../../../../../helpers';
import { getProductJsonLd, getLogoJsonLd } from '../../../../../helpers/getJsonLd';
import { notFound } from 'next/navigation';
import { getItemTranslations } from '../../../../../dictionaries';

export async function generateMetadata(props) {
  const params = await props.params;
  if (!params?.item) return notFound();
  const product = await getCachedProductByCode('earring', params.item, params?.lang);
  if (!product) return notFound();
  const lang = 'ru';
  return getProductMetadata({ product, categoryName: 'sergi', lang });
}

export async function generateStaticParams() {
  try {
    const products = await getCachedAllProducts('earring');
    if (!products || !products?.length) return [];
    // sergi/kupit-serebryanyye-sergi is Russian - only generate ru pages
    return products.map(product => ({ lang: 'ru', item: product.code.toString() }));
  } catch (e) {
    console.error('Error in RU earrings generateStaticParams:', e);
    return [];
  }
}

export default async function EarringsItem(props) {
  const params = await props.params;
  const lang = 'ru';
  const product = await getCachedProductByCode('earring', params.item, params?.lang);
  if (!product) return notFound();

  const categorySlug = 'sergi';
  const productSlug = 'kupit-serebryanyye-sergi';
  
  const productJsonLd = await getProductJsonLd(product, `${categorySlug}/${productSlug}`, { categoryName: categorySlug, lang });
  const logoJsonLd = getLogoJsonLd({ lang });
  const t = await getItemTranslations({ lang, categoryName: categorySlug, code: product.code }).catch(() => undefined);

  return (
    <>
      <ProductPageNew item={product} t={t} lang={lang} category="earring" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }} />
    </>
  );
}
