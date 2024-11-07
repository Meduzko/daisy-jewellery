import ProductPageNew from '../../../../components/ProductPage/ProductPageNew';
import { fetchProduct } from '../../../../actions/fetchProduct';
import { fetchAllProducts } from '../../../../actions/fetchAllProducts';
import { getProductMetadata } from '../../../../helpers';

export async function generateMetadata({ params }) {
  const [product] = await fetchProduct({
    code: params.item,
    categoryId: process.env.NECKLACE_CATEGORY_ID,
  });

  const productMetaData = getProductMetadata({ product, categoryName: 'necklace' });

  return productMetaData;
}

export async function generateStaticParams() {
  try {
    const products = await fetchAllProducts({
      categoryId: process.env.NECKLACE_CATEGORY_ID,
    });

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
  const [product] = await fetchProduct({ code: params.item, categoryId: process.env.NECKLACE_CATEGORY_ID });

  return (
    <ProductPageNew item={product} />
  )
}
