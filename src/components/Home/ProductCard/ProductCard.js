import Link from 'next/link';
import Image from 'next/image';
import styles from './ProductCard.module.css';

const formatPrice = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  // 1800 → «1 800» (no-break space keeps the price on one line)
  return String(Math.round(number)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
};

/**
 * Product card of the redesigned homepage.
 * variant="tile"  — packshot on the cream tile (new arrivals)
 * variant="photo" — full-bleed lifestyle photo (collection)
 */
export default function ProductCard({ product, variant = 'tile', sizes, currency = 'грн', className = '' }) {
  const { title, image, href, price, originalPrice, hasDiscount } = product;

  return (
    <article className={`${styles.card} ${styles[variant]} ${className}`}>
      <Link href={href} className={styles.link}>
        <span className={styles.media}>
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              sizes={sizes || '(max-width: 767px) 50vw, 25vw'}
              className={styles.image}
            />
          ) : null}
        </span>
        <h3 className={styles.name}>{title}</h3>
      </Link>
      <p className={styles.price}>
        {hasDiscount ? (
          <>
            <s className={styles.oldPrice}>{`${formatPrice(originalPrice)} ${currency}`}</s>{' '}
            <span>{`${formatPrice(price)} ${currency}`}</span>
          </>
        ) : (
          `${formatPrice(price)} ${currency}`
        )}
      </p>
    </article>
  );
}
