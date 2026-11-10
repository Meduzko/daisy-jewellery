import Image from 'next/image';
import Link from 'next/link';
import styles from './CategoryPage.module.css';

/** Editorial tile inside the product grid (spans two columns): photo, gradient, guide link. */
export default function EditorialTile({ image, imagePosition, kicker, title, text, cta, href }) {
  return (
    <Link href={href} className={styles.editorial}>
      <Image
        src={image}
        alt=""
        fill
        sizes="(min-width: 600px) 66vw, 100vw"
        className={styles.editorialImage}
        style={{ objectPosition: imagePosition }}
      />
      <span className={styles.editorialShade} aria-hidden="true" />
      <span className={styles.editorialBody}>
        <span className={styles.editorialKicker}>{kicker}</span>
        <span className={styles.editorialTitle}>{title}</span>
        <span className={styles.editorialText}>{text}</span>
        <span className={styles.editorialCta}>{cta}</span>
      </span>
    </Link>
  );
}
