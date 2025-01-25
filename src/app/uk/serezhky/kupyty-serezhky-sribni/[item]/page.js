import Breadcrumbs from '../../../../../components/Breadcrumbs';
import ProductPageNew from '../../../../../components/ProductPage';
import { fetchProduct } from '../../../../../actions/fetchProduct';
import { fetchAllProducts } from '../../../../../actions/fetchAllProducts';
import { getProductMetadata } from '../../../../../helpers';
import { getProductJsonLd, getLogoJsonLd } from '../../../../../helpers/getJsonLd';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  if (!params?.item) {
    return notFound();
  }

  try {
    const response = await fetchProduct({
      code: params.item,
      categoryId: process.env.EARING_CATEGORY_ID,
    });

    if (!response || response?.length === 0) {
      return notFound();
    }

    const [product] = response;
    return getProductMetadata({ product, categoryName: 'earring', lang: 'uk' });
  } catch (error) {
    console.error('Error generating serezhky metadata:', error);
    return notFound();
  }
}

export async function generateStaticParams() {
  try {
    const products = await fetchAllProducts({
      categoryId: process.env.EARING_CATEGORY_ID,
    });

    if (!products || !products.length) {
      return;
    }

    const productCodes = products.map((product) => ({
      item: product.code.toString(),
    }));

    return productCodes;
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}

export default async function EarringItem({ params }) {
  const [product] = await fetchProduct({ code: params.item, categoryId: process.env.EARING_CATEGORY_ID });

  if (!product) {
    return notFound();
  }

  const segments = [
    { name: 'Головна', href: '/uk' },
    { name: 'Сережки', href: '/uk/serezhky/1' },
    { name: product.title, href: `/uk/serezhky/kupyty-serezhky-sribni/${params.item}` },
  ];

  const productJsonLd = await getProductJsonLd(product, 'serezhky/kupyty-serezhky-sribni');
  const logoJsonLd = getLogoJsonLd();

  return (
    <>
      <Breadcrumbs segments={segments} />
      <ProductPageNew item={product} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }}
      />
    </>
  )
}
