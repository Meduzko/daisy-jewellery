import Link from 'next/link';
import Image from 'next/image';
import { getHomeCopy } from '../copy';
import { getCachedCategories } from '../../../lib/dataCache';
import { categoryHref } from '../../../lib/catalog/categories';
import ui from '../ui.module.css';
import styles from './Categories.module.css';

// Photos of the original categories (until a photo is uploaded in Directus).
const STATIC_IMAGES = {
  ring: { src: '/home/category-rings.jpg', position: '50% 50%' },
  earring: { src: '/home/category-earrings.webp', position: '60% 50%' },
  necklace: { src: '/categories/neclackle.webp', position: '50% 55%' },
  bracer: { src: '/categories/bracer.webp', position: '55% 50%' },
};

export default async function Categories({ lang = 'uk' }) {
  const copy = getHomeCopy(lang);
  const t = copy.categories;
  const locale = lang === 'ru' ? 'ru' : 'uk';

  // Categories with «show on homepage» (Directus; a photo and active products are required) + two curated collections
  // (approved design, «Категорії»).
  const categories = (await getCachedCategories())
    .filter((c) => c.showOnHomepage && c.productCount > 0)
    .map((c) => {
      const image = c.image ? { src: c.image, position: '50% 50%' } : STATIC_IMAGES[c.key];
      return image ? { key: c.key, title: c[locale].name, href: categoryHref(c, locale), ...image } : null;
    })
    .filter(Boolean);
  const items = [
    ...categories,
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
