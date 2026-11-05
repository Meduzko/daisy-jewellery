import Link from 'next/link';
import Image from 'next/image';
import { getHomeCopy, getCategoryLinks } from '../copy';
import ui from '../ui.module.css';
import styles from './Categories.module.css';

export default function Categories({ lang = 'uk' }) {
  const copy = getHomeCopy(lang);
  const t = copy.categories;
  const links = getCategoryLinks(lang);
  const locale = lang === 'ru' ? 'ru' : 'uk';

  // Four CMS categories + two curated collections (approved design, «Категорії»).
  const items = [
    { key: 'ring', title: copy.nav.ring, href: links.ring, src: '/home/category-rings.webp', position: '50% 50%' },
    { key: 'earring', title: copy.nav.earring, href: links.earring, src: '/home/category-earrings.webp', position: '60% 50%' },
    { key: 'necklace', title: copy.nav.necklace, href: links.necklace, src: '/categories/neclackle.webp', position: '50% 55%' },
    { key: 'bracer', title: copy.nav.bracer, href: links.bracer, src: '/categories/bracer.webp', position: '55% 50%' },
    { key: 'clover', title: t.clover, href: `/${locale}/search?q=${encodeURIComponent(copy.set.search)}`, src: '/home/category-clover.webp', position: '50% 45%' },
    { key: 'new', title: t.new, href: '#novynky', src: '/home/category-new.webp', position: '55% 45%' },
  ];

  return (
    <section id="kategorii" className={styles.section} aria-labelledby="kategorii-title">
      <div className={styles.heading}>
        <p className={`${ui.eyebrow} ${styles.eyebrow}`}>{t.eyebrow}</p>
        <h2 id="kategorii-title" className={ui.h2}>{t.title}</h2>
      </div>
      <ul className={styles.grid}>
        {items.map((item) => (
          <li key={item.key} className={styles.item}>
            <Link href={item.href} className={styles.link}>
              <span className={styles.ring}>
                <span className={styles.circle}>
                  <Image
                    src={item.src}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 100px, 176px"
                    className={styles.image}
                    style={{ objectPosition: item.position }}
                  />
                </span>
              </span>
              <span className={styles.label}>{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
