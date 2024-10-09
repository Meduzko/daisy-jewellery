import Link from 'next/link';
import styles from './styles.module.css';

export default function Banner() {
  return (
    <div className={styles.banner}>
      <div className={styles.bannerContent}>
        <h1 className={styles.bannerTitle}>Welcome to Daisy jewellery</h1>
        <div className={styles.bannerLinkCnt}>
          <Link className={styles.bannerLink} href="/">Перейти до категорій</Link>
        </div>
      </div>
    </div>
  );
}
