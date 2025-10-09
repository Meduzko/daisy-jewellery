export { default, generateMetadata } from '../../../serezhky/kupyty-serezhky-sribni/[item]/page';

import { fetchAllProducts } from '../../../../../actions/fetchAllProducts';

export async function generateStaticParams() {
  try {
    const products = await fetchAllProducts({ categoryId: process.env.EARING_CATEGORY_ID });
    if (!products || !products?.length) return [];
    return products.map(product => ({ lang: 'ru', item: product.code.toString() }));
  } catch (e) {
    console.error('Error in RU earrings alias generateStaticParams:', e);
    return [];
  }
}


