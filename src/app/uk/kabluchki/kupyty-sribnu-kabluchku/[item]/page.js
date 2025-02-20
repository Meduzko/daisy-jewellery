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
      categoryId: process.env.RING_CATEGORY_ID,
    });

    if (!response || response?.length === 0) {
      return notFound();
    }

    const [product] = response;
    return getProductMetadata({ product, categoryName: 'ring', lang: 'uk' });
  } catch (error) {
    console.error('Error generating metadata:', error);
    return notFound();
  }
}

export async function generateStaticParams() {
  try {
    const products = await fetchAllProducts({
      categoryId: process.env.RING_CATEGORY_ID,
    });

    if (!products || !products?.length) {
      return notFound();
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

export default async function Page({ params }) {
  if (!params?.item) {
    return notFound();
  }

  const [product] = await fetchProduct({
    code: params.item,
    categoryId: process.env.RING_CATEGORY_ID,
  });

  if (!product) {
    return notFound();
  }

  // Fetch prodcuts for sizes
  const products = await fetchProduct({
    sku: product.sku,
    categoryId: process.env.RING_CATEGORY_ID,
    website_synch: false
  });

  const productSizes = products?.flatMap(product => {
    const sizeTag = product.tags?.find(tag => tag.title === 'розмір');

    if (!sizeTag) return [];

    const sizes = sizeTag?.items?.map(item => {
      const size = parseFloat(item?.title?.replace(',', '.'));
      return !isNaN(size) ? size : null;
    }).filter(size => Boolean(size));

    return sizes;
  });

  const segments = [
    { name: 'Головна', href: '/uk' },
    { name: 'Каблучки', href: '/uk/kabluchki/1' },
    { name: product?.title, href: `/uk/kabluchki/kupyty-sribnu-kabluchku/${params.item}` },
  ];

  const productJsonLd = await getProductJsonLd(product, 'kabluchki/kupyty-sribnu-kabluchku');
  const logoJsonLd = getLogoJsonLd();

  return (
    <>
      <Breadcrumbs segments={segments} />
      <ProductPageNew item={product} productSizes={productSizes} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(logoJsonLd) }}
      />
    </>
  );
}
