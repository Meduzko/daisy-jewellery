import React from 'react';
import Link from 'next/link';
import styles from './styles.module.css';

export default function Navigation() {
  return (
    <nav className={styles.nav}>
      <ul className={styles.navList}>
        <li className={styles.navItem}>
          <Link href="/category/ring" className={styles.navLink}>Каблучки</Link>
        </li>
        <li className={styles.navItem}>
          <Link href="/category/earring" className={styles.navLink}>Сережки</Link>
        </li>
        <li className={styles.navItem}>
          <Link href="/category/necklace" className={styles.navLink}>Кольє</Link>
        </li>
        <li className={styles.navItem}>
          <Link href="/category/bracer" className={styles.navLink}>Браслети</Link>
        </li>
        <li className={styles.navItem}>
          <Link href="/" className={styles.navLink}>Підвіски</Link>
        </li>
        <li className={styles.navItem}>
          <Link href="/" className={styles.navLink}>Ланцюжки</Link>
        </li>
        <li className={styles.navItem}>
          <Link href="/" className={styles.navLink}>Упаковка</Link>
        </li>
      </ul>
      {/* <Link href="/" className={styles.navLink}>Home</Link>
      <Link href="/rings" className={styles.navLink}>Rings</Link>
      <Link href="/earrings" className={styles.navLink}>Earrings</Link> */}
    </nav>
  );
}