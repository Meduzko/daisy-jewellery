import ProductPageNew from '../../../../components/ProductPage';
import { fetchProduct } from '../../../../actions/fetchProduct';
import { fetchAllProducts } from '../../../../actions/fetchAllProducts';
import { getProductMetadata } from '../../../../helpers';

export async function generateMetadata({ params }) {
  const [product] = await fetchProduct({
    code: params.item,
    categoryId: process.env.RING_CATEGORY_ID,
  });

  const productMetaData = getProductMetadata({ product, categoryName: 'ring' });

  return productMetaData;
}

export async function generateStaticParams() {
  try {
    const products = await fetchAllProducts({
      categoryId: process.env.RING_CATEGORY_ID,
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

export default async function Page({ params }) {
  const [product] = await fetchProduct({
    code: params.item,
    categoryId: process.env.RING_CATEGORY_ID,
  });

  // Fetch prodcuts for sizes
  const products = await fetchProduct({
    sku: product.sku,
    categoryId: process.env.RING_CATEGORY_ID,
  });

  const productSizes = products.flatMap(product => {
    const sizeTag = product.tags?.find(tag => tag.title === 'розмір');

    return sizeTag?.items?.map(item => {
      const size = parseFloat(item?.title?.replace(',', '.'));
      return !isNaN(size) ? size : null;
    }).filter(size => size !== null);
  });

  return <ProductPageNew item={product} productSizes={productSizes} />;
}
