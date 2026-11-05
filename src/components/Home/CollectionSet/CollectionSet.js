import Link from 'next/link';
import Image from 'next/image';
import { getHomeProducts } from '../../../lib/homeProducts';
import { CLOVER_SET } from '../config';
import { getHomeCopy, plural } from '../copy';
import ProductCard from '../ProductCard/ProductCard';
import ui from '../ui.module.css';
import styles from './CollectionSet.module.css';

export default async function CollectionSet({ lang = 'uk' }) {
  const copy = getHomeCopy(lang);
  const t = copy.set;
  const locale = lang === 'ru' ? 'ru' : 'uk';
  const products = await getHomeProducts(CLOVER_SET, lang);

  if (!products.length) return null;

  const collectionHref = `/${locale}/search?q=${encodeURIComponent(t.search)}`;

  return (
    <section className={styles.section} aria-labelledby="klever-title">
      <div className={styles.inner}>
        <div className={styles.feature}>
          <Image
            src="/home/clover-set.webp"
            alt={t.imageAlt}
            fill
            sizes="(max-width: 899px) 100vw, 46vw"
            className={styles.image}
          />
          <div className={styles.scrim} aria-hidden="true" />
          <div className={styles.overlay}>
            <p className={`${ui.eyebrow} ${styles.eyebrow}`}>
              {t.eyebrow.replace('{count}', `${products.length} ${plural(products.length, t.items)}`)}
            </p>
            <h2 id="klever-title" className={styles.title}>
              {t.titleA} <em>{t.titleB}</em>
            </h2>
            <p className={styles.text}>
              <span className={ui.onlyWide}>{t.text}</span>
              <span className={ui.onlyNarrow}>{t.textShort}</span>
            </p>
            <Link href={collectionHref} className={styles.cta}>
              {t.cta}
              <svg width="24" height="10" viewBox="0 0 28 12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                <path d="M0 6h27M22 1l5 5-5 5" />
              </svg>
            </Link>
          </div>
        </div>

        <div className={styles.products}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="photo"
              currency={copy.currency}
              sizes="(max-width: 599px) 50vw, (max-width: 899px) 25vw, 25vw"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
