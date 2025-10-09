export { default, generateMetadata } from '../../kupit-serebryanyy-braslet/[item]/page';

import { fetchAllProducts } from '../../../../../actions/fetchAllProducts';

export async function generateStaticParams() {
  try {
    const products = await fetchAllProducts({ categoryId: process.env.BRACER_CATEGORY_ID });
    if (!products || !products?.length) return [];
    return products.map(product => ({ lang: 'uk', item: product.code.toString() }));
  } catch (e) {
    console.error('Error in UK bracelet alias generateStaticParams:', e);
    return [];
  }
}


