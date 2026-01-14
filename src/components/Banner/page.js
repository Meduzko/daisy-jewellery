import Link from 'next/link';
import { getTranslation } from '../../dictionaries';
import Image from 'next/image';
import styles from './styles.module.css';
import { getDeviceType } from '../../helpers';

export default async function Banner({ lang = 'uk' } = {}) {
  const device = getDeviceType();
  const isMobile = device !== 'desktop';
  const bannerTk = await getTranslation({ lang, key: 'banner' });
  const bannerTitle = bannerTk?.title || 'Срібні прикраси Daisy Jewellery — ваш улюблений інтернет-магазин';

  return (
    <div className={styles.bannerContainer}>
      <Image
        src={isMobile ? '/banner_mobile.webp' : '/banner.webp'}
        alt="Main banner"
        fill
        priority={true}
        quality={75}
        sizes="100vw"
        style={{ objectFit: 'cover' }}
        className={styles.bannerImg}
      />
      <div className={styles.bannerOverlay} />
      <div className={styles.bannerContent}>
        <span className={styles.bannerAccent}>✦</span>
        <h1 className={styles.bannerText}>{bannerTitle}</h1>
        <div className={styles.bannerDivider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerIcon}>◇</span>
          <span className={styles.dividerLine} />
        </div>
        <Link href={`/${lang}/koltsa/1`} className={styles.bannerCta}>
          Переглянути колекцію
        </Link>
      </div>
    </div>
  )
}
