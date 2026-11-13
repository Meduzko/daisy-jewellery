export const revalidate = 900;
import ProductPageNew from '../../../../../components/ProductPage';
import { getCachedAllProducts, getCachedProductByCode } from '../../../../../lib/dataCache';
import { getProductMetadata } from '../../../../../helpers';
import { getProductJsonLd, getLogoJsonLd } from '../../../../../helpers/getJsonLd';
import { notFound } from 'next/navigation';
import { getItemTranslations } from '../../../../../dictionaries';

export async function generateMetadata(props) {
  const params = await props.params;
  if (!params?.item) {
    return notFound();
  }

  const product = await getCachedProductByCode('bracer', params.item, params?.lang);

  if (!product) {
    return notFound();
  }

  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  return getProductMetadata({ product, categoryName: 'braslety', lang });
}

export async function generateStaticParams() {
  try {
    const products = await getCachedAllProducts('bracer');
    if (!products || !products?.length) return [];
    return products.map(product => ({ lang: 'ru', item: product.code.toString() }));
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}

export default async function BracerItem(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const product = await getCachedProductByCode('bracer', params.item, params?.lang);

  if (!product) {
    return notFound();
  }

  const productJsonLd = await getProductJsonLd(product, lang === 'ru' ? 'braslety/kupit-serebryanyy-braslet' : 'braslety/kupyty-sribnyy-braslet', { categoryName: 'braslety', lang });
  const logoJsonLd = getLogoJsonLd({ lang });
  const t = await getItemTranslations({ lang, categoryName: 'braslety', code: product.code });

  return (
    <>
      <ProductPageNew item={product} t={t} lang={lang} category="bracer" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }} />
    </>
  );
}


