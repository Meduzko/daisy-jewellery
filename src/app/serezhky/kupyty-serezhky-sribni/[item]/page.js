import ProductPageNew from '../../../../components/ProductPage';
import { fetchProduct } from '../../../../actions/fetchProduct';
import { fetchAllProducts } from '../../../../actions/fetchAllProducts';
import { getProductMetadata } from '../../../../helpers';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const [product] = await fetchProduct({
    code: params.item,
    categoryId: process.env.EARING_CATEGORY_ID,
  });

  if (!product) {
    return;
  }

  return getProductMetadata({ product, categoryName: 'earring' });
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

  return (
    <ProductPageNew item={product} />
  )
}
