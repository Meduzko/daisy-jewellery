export const revalidate = 900;
import Breadcrumbs from '../../../../../components/Breadcrumbs';
import ProductPageNew from '../../../../../components/ProductPage';
import { getServerProductSizes } from '../../../../../actions/fetchProduct';
import { getCachedAllProducts, getCachedProductByCode } from '../../../../../lib/dataCache';
import { getProductMetadata } from '../../../../../helpers';
import { getProductJsonLd, getLogoJsonLd } from '../../../../../helpers/getJsonLd';
import { notFound } from 'next/navigation';
import { getItemTranslations } from '../../../../../dictionaries';

export async function generateMetadata({ params }) {
  if (!params?.item) return notFound();
  const product = await getCachedProductByCode(process.env.RING_CATEGORY_ID, params.item);
  if (!product) return notFound();
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  return getProductMetadata({ product, categoryName: lang === 'ru' ? 'koltsa' : 'ring', lang });
}

export async function generateStaticParams() {
  try {
    const products = await getCachedAllProducts(process.env.RING_CATEGORY_ID);
    if (!products || !products?.length) return [];
    return products.map(product => ({ lang: 'ru', item: product.code.toString() }));
  } catch (e) {
    console.error('Error in generateStaticParams:', e);
    return [];
  }
}

export default async function RingItem({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const product = await getCachedProductByCode(process.env.RING_CATEGORY_ID, params.item);
  if (!product) return notFound();

  const productSizes = await getServerProductSizes(product.sku, process.env.RING_CATEGORY_ID);
  const productJsonLd = await getProductJsonLd(product, lang === 'ru' ? 'koltsa/kupit-serebryanoye-koltso' : 'kabluchki/kupyty-sribnu-kabluchku', { categoryName: lang === 'ru' ? 'koltsa' : 'ring', lang });
  const logoJsonLd = getLogoJsonLd({ lang });
  const t = await getItemTranslations({ lang, categoryName: lang === 'ru' ? 'koltsa' : 'ring', code: product.code }).catch(() => undefined);

  const segments = [
    { name: lang === 'ru' ? 'Главная' : 'Головна', href: `/${lang}` },
    { name: lang === 'ru' ? 'Кольца' : 'Каблучки', href: `/${lang}/${lang === 'ru' ? 'koltsa' : 'kabluchki'}/1` },
    { name: t?.title || product?.title, href: `/${lang}/${lang === 'ru' ? 'koltsa/kupit-serebryanoye-koltso' : 'kabluchki/kupyty-sribnu-kabluchku'}/${params.item}` },
  ];

  return (
    <>
      <Breadcrumbs segments={segments} />
      <ProductPageNew item={product} productSizes={productSizes} t={t} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }} />
    </>
  );
}


