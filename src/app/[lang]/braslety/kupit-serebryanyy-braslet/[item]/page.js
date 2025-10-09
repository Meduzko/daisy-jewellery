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
  if (!params?.item) {
    return notFound();
  }

  try {
    const response = await fetchProduct({
      code: params.item,
      categoryId: process.env.BRACER_CATEGORY_ID,
    });

    if (!response || response?.length === 0) {
      return notFound();
    }

    const [product] = response;
    const lang = params?.lang === 'ru' ? 'ru' : 'uk';
    return getProductMetadata({ product, categoryName: 'braslety', lang });
  } catch (error) {
    console.error('Error generating baslety metadata:', error);
    return notFound();
  }
}

export async function generateStaticParams() {
  try {
    const products = await fetchAllProducts({ categoryId: process.env.BRACER_CATEGORY_ID });
    if (!products || !products?.length) return [];
    const langs = ['uk', 'ru'];
    return langs.flatMap(lang => products.map(product => ({ lang, item: product.code.toString() })));
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}

export default async function BracerItem({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const [product] = await fetchProduct({ code: params.item, categoryId: process.env.BRACER_CATEGORY_ID });

  if (!product) {
    return notFound();
  }

  const productJsonLd = await getProductJsonLd(product, lang === 'ru' ? 'braslety/kupit-serebryanyy-braslet' : 'braslety/kupyty-sribnyy-braslet', { categoryName: 'braslety', lang });
  const logoJsonLd = getLogoJsonLd({ lang });
  const t = await getItemTranslations({ lang, categoryName: 'braslety', code: product.code });

  const segments = [
    { name: lang === 'ru' ? 'Главная' : 'Головна', href: `/${lang}` },
    { name: lang === 'ru' ? 'Браслеты' : 'Браслети', href: `/${lang}/braslety/1` },
    { name: t?.title || product?.title, href: `/${lang}/braslety/${lang === 'ru' ? 'kupit-serebryanyy-braslet' : 'kupyty-sribnyy-braslet'}/${params.item}` },
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


