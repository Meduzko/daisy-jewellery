import { Suspense } from 'react'
import SwiperCarousel from '../SwiperCarousel/carousel';
// import { fetchRings } from '../../../pages/api/fetchRing/index';
// import { fetchRings } from '../../pages/api/fetchRing/index';
import newProducts from './new-products.json';
import styles from './styles.module.css';

export default async function RingsSlider() {

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className={`${styles.sliderContainer} container`}>
        <div className={styles.sliderCtn}>
          <h1 className='title'>Новинки</h1>
          <SwiperCarousel data={newProducts} />
        </div>
      </div>
    </Suspense>
  );
}
