import Link from 'next/link';
import Image from 'next/image';
import { getHomeCopy } from '../copy';
import ui from '../ui.module.css';
import styles from './WhyDaisy.module.css';

const NUMERALS = ['i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.'];

export default function WhyDaisy({ lang = 'uk' }) {
  const t = getHomeCopy(lang).why;
  const locale = lang === 'ru' ? 'ru' : 'uk';

  return (
    <section className={styles.section} aria-labelledby="why-title">
      <div className={styles.inner}>
        <div className={styles.media}>
          <div className={styles.photo}>
            <Image
              src="/delivery_2.jpg"
              alt={t.imageAlt}
              fill
              sizes="(max-width: 899px) 100vw, 40vw"
              className={styles.image}
            />
          </div>
          <div className={styles.badge}>
            <p className={styles.badgeValue}>925°</p>
            <p className={styles.badgeLabel}>
              <span className={ui.onlyWide}>{t.badge}</span>
              <span className={ui.onlyNarrow}>{t.badgeShort}</span>
            </p>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.head}>
            <p className={ui.eyebrow}>{t.eyebrow}</p>
            <h2 id="why-title" className={`${ui.h2} ${styles.title}`}>{t.title}</h2>
          </div>
          <ol className={styles.list}>
            {t.items.map((item, index) => (
              <li key={item.title} className={styles.row}>
                <span className={styles.numeral} aria-hidden="true">{NUMERALS[index]}</span>
                <div>
                  <h3 className={styles.rowTitle}>
                    {item.titleShort ? (
                      <>
                        <span className={ui.onlyWide}>{item.title}</span>
                        <span className={ui.onlyNarrow}>{item.titleShort}</span>
                      </>
                    ) : (
                      item.title
                    )}
                  </h3>
                  <p className={styles.rowText}>
                    <span className={ui.onlyWide}>{item.text}</span>
                    <span className={ui.onlyNarrow}>{item.short}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <Link href={`/${locale}/delivery`} className={`${ui.navlink} ${ui.ulink} ${styles.link}`}>
            {t.link}
          </Link>
        </div>
      </div>
    </section>
  );
}
