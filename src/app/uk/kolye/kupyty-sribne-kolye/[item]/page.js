import ProductPageNew from '../../../../../components/ProductPage';
import { fetchProduct } from '../../../../../actions/fetchProduct';
import { fetchAllProducts } from '../../../../../actions/fetchAllProducts';
import { getProductMetadata } from '../../../../../helpers';
import { getProductJsonLd, getLogoJsonLd } from '../../../../../helpers/getJsonLd';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const [product] = await fetchProduct({
    code: params.item,
    categoryId: process.env.NECKLACE_CATEGORY_ID,
  });

  if (!product) {
    return;
  }

  return getProductMetadata({ product, categoryName: 'necklace', lang: 'uk' });
}

export async function generateStaticParams() {
  try {
    const products = await fetchAllProducts({
      categoryId: process.env.NECKLACE_CATEGORY_ID,
    });

    if (!products || !products.length) {
      return;
    }

    const productCodes = products?.map((product) => ({
      item: product.code.toString(),
    }));

    return productCodes;
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}

export default async function EarringItem({ params }) {
  const [product] = await fetchProduct({ code: params.item, categoryId: process.env.NECKLACE_CATEGORY_ID });

  if (!product) {
    return notFound();
  }

  const productJsonLd = await getProductJsonLd(product, 'kolye/kupyty-sribne-kolye');
  const logoJsonLd = getLogoJsonLd();

  return (
    <>
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
