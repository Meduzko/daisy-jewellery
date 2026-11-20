import Link from 'next/link';
import { getImageProps } from 'next/image';
import ui from '../ui.module.css';
import styles from './PromoSlide.module.css';

// One image + copy slide of the hero slider. Server component: the markup is static,
// HeroCarousel only toggles which slide is visible.
// Art direction: a portrait crop below 900px, the 3:2 original from 900px (same breakpoint as Hero).
export default function PromoSlide({ slide, copy, lang, preload = false }) {
  const ctaHref = slide.cta.href[lang] ?? slide.cta.href;
  const { desktop, mobile } = slide.image;
  const loading = preload
    ? { loading: 'eager', fetchPriority: 'high' }
    : { loading: 'lazy', fetchPriority: 'low' };

  const { props: { srcSet: desktopSrcSet, sizes: desktopSizes } } = getImageProps({
    alt: '',
    src: desktop.src,
    width: desktop.width,
    height: desktop.height,
    quality: 85,
    sizes: '75vw',
  });
  const { props: mobileImg } = getImageProps({
    alt: copy.imageAlt,
    src: mobile.src,
    width: mobile.width,
    height: mobile.height,
    quality: 75,
    sizes: '100vw',
    ...loading,
  });

  const isStatement = slide.layout === 'statement';
  const Heading = slide.heading === 'h1' ? 'h1' : 'h2';
  const layoutClass = styles[slide.layout] || styles.brand;

  return (
    <div
      className={`${styles.slide} ${layoutClass} ${slide.theme === 'dark' ? styles.dark : ''}`}
      style={{ '--pos-m': mobile.position, '--pos-d': desktop.position }}
    >
      <div className={styles.media}>
        <picture>
          <source media="(min-width: 900px)" srcSet={desktopSrcSet} sizes={desktopSizes} />
          {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
          <img {...mobileImg} className={styles.image} />
        </picture>
      </div>
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.content}>
        <p className={`${ui.eyebrow} ${styles.eyebrow}`}>{copy.eyebrow}</p>
        <Heading className={styles.title}>
          {isStatement ? (
            <>
              <span className={styles.titleBrand}>{copy.titleA}</span>
              <em className={styles.titleTag}>
                <span aria-hidden="true">– </span>
                {copy.titleB}
              </em>
            </>
          ) : (
            <>
              {copy.titleA} <br />
              <em>{copy.titleB}</em>
            </>
          )}
        </Heading>
        {copy.highlight && <p className={styles.highlight}>{copy.highlight}</p>}
        <p className={styles.text}>
          <span className={ui.onlyWide}>{copy.text}</span>
          <span className={ui.onlyNarrow}>{copy.textShort}</span>
        </p>
        <div className={styles.actions}>
          <Link href={ctaHref} className={styles.cta}>{copy.cta}</Link>
          {slide.secondary && copy.secondary && (
            <Link href={slide.secondary.href} className={`${ui.navlink} ${ui.ulink} ${styles.secondary}`}>
              {copy.secondary}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
