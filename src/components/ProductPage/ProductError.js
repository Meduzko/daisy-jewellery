'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getProductCopy } from './copy';
import styles from './ProductPage.module.css';

/** Route error boundary of the product pages: the catalog could not be read. */
export default function ProductError({ reset }) {
  const params = useParams();
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const copy = getProductCopy(lang);

  return (
    <main className={`${styles.page} ${styles.errorPage}`}>
      <h1 className={styles.title}>{copy.errorTitle}</h1>
      <p className={styles.descriptor}>{copy.errorText}</p>
      <div className={styles.errorActions}>
        <button type="button" className={styles.cta} onClick={() => reset()}>{copy.retry}</button>
        <Link href={`/${lang}`} className={`${styles.label} ${styles.relatedButton} ${styles.errorHome}`}>{copy.toHome}</Link>
      </div>
    </main>
  );
}
