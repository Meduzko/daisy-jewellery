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
  try {
    const response = await fetchProduct({ code: params.item, categoryId: process.env.EARING_CATEGORY_ID });
    if (!response || response?.length === 0) return notFound();
    const [product] = response;
    const lang = params?.lang === 'ru' ? 'ru' : 'uk';
    return getProductMetadata({ product, categoryName: lang === 'ru' ? 'sergi' : 'serezhky', lang });
  } catch (e) {
    console.error('Error generating earring metadata:', e);
    return notFound();
  }
}

export async function generateStaticParams() {
  try {
    const products = await fetchAllProducts({ categoryId: process.env.EARING_CATEGORY_ID });
    if (!products || !products?.length) return [];
    return products.map(product => ({ lang: 'uk', item: product.code.toString() }));
  } catch (e) {
    console.error('Error in generateStaticParams:', e);
    return [];
  }
}

export default async function EarringsItem({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const [product] = await fetchProduct({ code: params.item, categoryId: process.env.EARING_CATEGORY_ID });
  if (!product) return notFound();

  const productJsonLd = await getProductJsonLd(product, lang === 'ru' ? 'sergi/kupit-serebryanyye-sergi' : 'serezhky/kupyty-serezhky-sribni', { categoryName: lang === 'ru' ? 'sergi' : 'serezhky', lang });
  const logoJsonLd = getLogoJsonLd({ lang });
  const t = await getItemTranslations({ lang, categoryName: lang === 'ru' ? 'sergi' : 'serezhky', code: product.code }).catch(() => undefined);

  const segments = [
    { name: lang === 'ru' ? 'Главная' : 'Головна', href: `/${lang}` },
    { name: lang === 'ru' ? 'Серьги' : 'Сережки', href: `/${lang}/${lang === 'ru' ? 'sergi' : 'serezhky'}/1` },
    { name: t?.title || product?.title, href: `/${lang}/${lang === 'ru' ? 'sergi/kupit-serebryanyye-sergi' : 'serezhky/kupyty-serezhky-sribni'}/${params.item}` },
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


