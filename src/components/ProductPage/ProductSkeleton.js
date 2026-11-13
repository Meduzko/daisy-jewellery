import styles from './ProductSkeleton.module.css';

/** Placeholder while a product page loads (route `loading.js`): same grid as the page. */
export default function ProductSkeleton() {
  return (
    <main className={styles.page} aria-busy="true">
      <div className={styles.product}>
        <div className={styles.gallery}>
          <div className={styles.hero} />
        </div>
        <div className={styles.panel}>
          <div className={styles.line} style={{ width: '30%' }} />
          <div className={styles.titleLine} />
          <div className={styles.titleLine} style={{ width: '70%' }} />
          <div className={styles.line} style={{ width: '55%' }} />
          <div className={styles.line} style={{ width: '25%', height: 22, marginTop: 24 }} />
          <div className={styles.sizes}>
            {Array.from({ length: 8 }, (_, i) => <div key={i} className={styles.size} />)}
          </div>
          <div className={styles.cta} />
        </div>
      </div>
    </main>
  );
}
