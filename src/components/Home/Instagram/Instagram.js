import Image from 'next/image';
import { getHomeCopy, SOCIAL } from '../copy';
import { INSTAGRAM_POSTS } from '../config';
import ui from '../ui.module.css';
import styles from './Instagram.module.css';

export default function Instagram({ lang = 'uk' }) {
  const t = getHomeCopy(lang).instagram;

  return (
    <section className={styles.section} aria-labelledby="instagram-title">
      <div className={styles.inner}>
        <div className={styles.intro}>
          <div className={styles.text}>
            <p className={ui.eyebrow}>{t.eyebrow}</p>
            <h2 id="instagram-title" className={`${ui.h2} ${styles.title}`}>{t.title}</h2>
            <p className={styles.lead}>
              <span className={ui.onlyWide}>{t.text}</span>
              <span className={ui.onlyNarrow}>{t.textShort}</span>
            </p>
          </div>
          <a
            href={SOCIAL.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={`${ui.btn} ${ui.btnOutline} ${styles.button}`}
          >
            {SOCIAL.instagramHandle}
          </a>
        </div>

        <ul className={styles.grid}>
          {INSTAGRAM_POSTS.map((post, index) => (
            <li key={post.src} className={styles.tile}>
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.tileLink}
              >
                <Image
                  src={post.src}
                  alt={`${t.post} ${index + 1}`}
                  fill
                  sizes="(max-width: 899px) 33vw, 21vw"
                  className={styles.image}
                  style={{ objectPosition: post.position }}
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
