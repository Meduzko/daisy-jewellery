import Link from 'next/link';
import Image from 'next/image';
import { getHomeCopy, getCategoryLinks } from '../copy';
import ui from '../ui.module.css';
import styles from './Hero.module.css';

export default function Hero({ lang = 'uk' }) {
  const t = getHomeCopy(lang).hero;
  const nav = getHomeCopy(lang).nav;
  const links = getCategoryLinks(lang);

  return (
    <section className={styles.hero} aria-label={t.label}>
      <div className={styles.media}>
        <Image
          src="/banner.webp"
          alt={t.imageAlt}
          fill
          priority
          quality={85}
          sizes="(max-width: 899px) 100vw, 105vw"
          className={styles.image}
        />
        <Link href={links.ring} className={`${styles.hotspot} ${styles.hotspotRing}`}>
          <span className={styles.hotspotDot} aria-hidden="true" />
          <span className={ui.eyebrow}>{nav.ring}</span>
        </Link>
        <Link href={links.bracer} className={`${styles.hotspot} ${styles.hotspotBracelet}`}>
          <span className={styles.hotspotDot} aria-hidden="true" />
          <span className={ui.eyebrow}>{nav.bracer}</span>
        </Link>
      </div>
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.content}>
        <p className={`${ui.eyebrow} ${styles.eyebrow}`}>{t.eyebrow}</p>
        <h1 className={styles.title}>
          {t.titleA} <br className={styles.wideBreak} />
          <em>{t.titleB}</em>
          <br />
          {/* The visible heading is the brand; screen readers and crawlers get what the page is about. */}
          <span className={ui.visuallyHidden}> — {t.h1Suffix}</span>
        </h1>
        <p className={styles.text}>
          <span className={ui.onlyWide}>{t.text}</span>
          <span className={ui.onlyNarrow}>{t.textShort}</span>
        </p>
        <div className={styles.actions}>
          <Link href="#kategorii" className={styles.cta}>{t.cta}</Link>
          <Link href="#novynky" className={`${ui.navlink} ${ui.ulink} ${styles.secondary}`}>
            {t.secondary}
          </Link>
        </div>
      </div>

      <p className={`${ui.eyebrow} ${styles.categories}`}>{t.categories}</p>
    </section>
  );
}
