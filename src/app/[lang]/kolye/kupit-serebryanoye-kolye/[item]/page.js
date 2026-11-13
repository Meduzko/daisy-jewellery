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
  const product = await getCachedProductByCode('necklace', params.item, params?.lang);
  if (!product) return notFound();
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  return getProductMetadata({ product, categoryName: 'kolye', lang });
}

export async function generateStaticParams() {
  try {
    const products = await getCachedAllProducts('necklace');
    if (!products || !products?.length) return [];
    return products.map(product => ({ lang: 'ru', item: product.code.toString() }));
  } catch (e) {
    console.error('Error in generateStaticParams:', e);
    return [];
  }
}

export default async function NecklaceItem(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const product = await getCachedProductByCode('necklace', params.item, params?.lang);
  if (!product) return notFound();

  const productJsonLd = await getProductJsonLd(product, lang === 'ru' ? 'kolye/kupit-serebryanoye-kolye' : 'kolye/kupyty-sribne-kolye', { categoryName: 'kolye', lang });
  const logoJsonLd = getLogoJsonLd({ lang });
  const t = await getItemTranslations({ lang, categoryName: 'kolye', code: product.code }).catch(() => undefined);

  return (
    <>
      <ProductPageNew item={product} t={t} lang={lang} category="necklace" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }} />
    </>
  );
}


