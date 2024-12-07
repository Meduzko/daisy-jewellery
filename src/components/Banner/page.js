import Link from 'next/link';
import Image from 'next/image';
import styles from './styles.module.css';

export default function Banner() {
  return (
    <div className={styles.bannerContainer}>
      <Image
        src="/banner.jpg"
        alt="Main banner"
        fill
        objectFit="cover"
        priority={true}
        quality={90}
        className={styles.bannerImg}
      />
      <h1 className={styles.bannerText}>Магазин срібних прикрас — Daisy Jewellery</h1>
      {/* <div className={styles.bannerBackground}>
        <h1><Link className={styles.bannerLink} href="/">—Перейти до категорій</Link></h1>
      </div> */}
    </div>
  )
}
