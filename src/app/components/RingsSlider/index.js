import { Suspense } from 'react'
import SwiperCarousel from '../SwiperCarousel/carousel';
import { fetchRings } from '../../api/ring/index';
import styles from './styles.module.css';

export default async function RingsSlider() {
  const rings = await fetchRings();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="container">
        <div className={styles.sliderCtn}>
          <h1 className='title'>Новинки</h1>
          <SwiperCarousel data={rings} />
        </div>
      </div>
    </Suspense>
  );
}
