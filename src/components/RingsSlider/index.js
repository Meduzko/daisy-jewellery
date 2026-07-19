import { Suspense } from 'react'
import SwiperCarousel from '../SwiperCarousel/carousel';
import { getCachedProductByCode } from '../../lib/dataCache';
import { categoryMap } from '../../helpers';
import { NEW_PRODUCTS } from './config';
import styles from './styles.module.css';

export default async function RingsSlider({ lang = 'uk' }) {
  const products = (
    await Promise.all(
      NEW_PRODUCTS.map(async ({ category, code }) => {
        const categoryId = categoryMap[category];
        if (!categoryId) return null;
        try {
          const product = await getCachedProductByCode(categoryId, code);
          // Inject category from config so getProductLink builds the correct URL.
          return product ? { ...product, category } : null;
        } catch {
          return null;
        }
      })
    )
  ).filter(Boolean);

  if (!products.length) return null;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className={`${styles.sliderContainer} container`}>
        <div className={styles.sliderCtn}>
          <h2 className={styles.sliderTitle}>Новинки</h2>
          <SwiperCarousel data={products} lang={lang} />
        </div>
      </div>
    </Suspense>
  );
}
