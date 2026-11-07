export { default, generateMetadata } from '../../kupit-serebryanyy-braslet/[item]/page';

import { getCachedAllProducts } from '../../../../../lib/dataCache';

export async function generateStaticParams() {
  try {
    const products = await getCachedAllProducts('bracer');
    if (!products || !products?.length) return [];
    return products.map(product => ({ lang: 'uk', item: product.code.toString() }));
  } catch (e) {
    console.error('Error in UK bracelet alias generateStaticParams:', e);
    return [];
  }
}


