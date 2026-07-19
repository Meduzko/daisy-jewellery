import Link from 'next/link';
import { getTranslation } from '../../dictionaries';
import { getImageProps } from 'next/image';
import styles from './styles.module.css';

const MOBILE_MEDIA = '(max-width: 1024px)';
const DESKTOP_MEDIA = '(min-width: 1025px)';

export default async function Banner({ lang = 'uk' } = {}) {
  const bannerTk = await getTranslation({ lang, key: 'banner' });
  const bannerTitle = bannerTk?.title || 'Срібні прикраси Daisy Jewellery — ваш улюблений інтернет-магазин';
  const bannerLink = lang === 'uk' ? '/uk/kabluchki/1' : '/ru/koltsa/1';
  const bannerLinkText = lang === 'uk' ? 'Переглянути колекцію' : 'Просмотреть колекцию';

  const common = { alt: 'Main banner', fill: true, priority: true, quality: 90, sizes: '100vw' };
  const { props: { srcSet: desktopSrcSet } } = getImageProps({ ...common, src: '/banner.webp' });
  const { props: { srcSet: mobileSrcSet, ...imgProps } } = getImageProps({ ...common, src: '/banner_mobile.webp' });

  return (
    <div className={styles.bannerContainer}>
      <picture>
        <source media={MOBILE_MEDIA} srcSet={mobileSrcSet} sizes="100vw" />
        <source media={DESKTOP_MEDIA} srcSet={desktopSrcSet} sizes="100vw" />
        <img
          {...imgProps}
          alt="Main banner"
          className={styles.bannerImg}
          style={{ ...imgProps.style, objectFit: 'cover' }}
        />
      </picture>
      <div className={styles.bannerOverlay} />
      <div className={styles.bannerContent}>
        {/* <span className={styles.bannerAccent}>✦</span> */}
        <h1 className={styles.bannerText}>{bannerTitle}</h1>
        {/* <div className={styles.bannerDivider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerIcon}>◇</span>
          <span className={styles.dividerLine} />
        </div> */}
        <Link href={bannerLink} className={styles.bannerCta}>
          {bannerLinkText}
        </Link>
      </div>
    </div>
  )
}
