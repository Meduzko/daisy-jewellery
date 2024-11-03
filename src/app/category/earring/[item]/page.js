import ProductPageNew from '../../../../components/ProductPage/ProductPageNew';
import { fetchProduct } from '../../../../actions/fetchProduct';
import { fetchAllProducts } from '../../../../actions/fetchAllProducts';

export async function generateMetadata({ params, searchParams }, parent) {
  const [product] = await fetchProduct({
    code: params.item,
    categoryId: process.env.EARING_CATEGORY_ID,
  });

  const previousImages = (await parent).openGraph?.images || [];
  const siteName = 'Daisy Jewellery';
  const keywords = 'Срібло';
  const shortDescription = product.short_description.replace(/<[^>]*>/g, '');
  const description = shortDescription.replace(/&[^;\s]+;/g, '');

  return {
    title: `${product.title} | ${siteName}`,
    description,
    keywords: keywords,
    url: `https://www.yourwebsite.com/category/earring/${product.code}`,
    openGraph: {
      images: ['/some-specific-page-image.jpg', ...previousImages],
    },
  }
}

export async function generateStaticParams() {
  try {
    const products = await fetchAllProducts({
      categoryId: process.env.EARING_CATEGORY_ID,
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
  const [product] = await fetchProduct({ code: params.item, categoryId: process.env.EARING_CATEGORY_ID });

  return (
    <ProductPageNew item={product} />
  )
}
