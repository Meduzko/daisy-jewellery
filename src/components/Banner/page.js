import Link from 'next/link';
import Image from 'next/image';
import styles from './styles.module.css';
import { getDeviceType } from '../../helpers';

export default function Banner() {
  const device = getDeviceType();
  const isMobile = device !== 'desktop';

  return (
    <div className={styles.bannerContainer}>
      <Image
        src={isMobile ? '/banner_mobile.webp' : '/banner.webp'}
        alt="Main banner"
        fill
        priority={true}
        quality={35}
        sizes="100vw"
        style={{ objectFit: 'cover' }}
        className={styles.bannerImg}
      />
      <h1 className={styles.bannerText}>Срібні прикраси Daisy Jewellery — ваш улюблений інтернет-магазин</h1>
      {/* <h1 className={styles.bannerText}>Срібні прикраси Daisy Jewellery</h1> */}
      {/* <div className={styles.bannerBackground}>
        <h1><Link className={styles.bannerLink} href="/">—Перейти до категорій</Link></h1>
      </div> */}
    </div>
  )
}
