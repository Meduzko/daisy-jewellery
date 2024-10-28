"use client";

import Link from "next/link"
import { usePathname } from 'next/navigation';
import { IconButton } from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import FacebookIcon from '@mui/icons-material/Facebook';
import styles from './styles.module.css';

const pagesWithoutFooter = ['/order', '/category/earring/'];

export default function Footer() {
  const pathname = usePathname();
  const isFooterHidden = pagesWithoutFooter.includes(pathname);

  if (isFooterHidden) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={`${styles.footerCategories} ${styles.footerCol}`}>
          <h3 className={styles.footerCategoryTitle}>Категорії</h3>
          <ul className={styles.footerList}>
            <li className={styles.footerListItem}>
              <Link href="/category/ring">Каблучки</Link>
            </li>
            <li className={styles.footerListItem}>
              <Link href="/category/earring">Сережки</Link>
            </li>
            <li className={styles.footerListItem}>
              <Link href="/category/ring">Кольє</Link>
            </li>
            <li className={styles.footerListItem}>
              <Link href="/category/ring">Браслет</Link>
            </li>
            <li className={styles.footerListItem}>
              <Link href="/category/ring">Підвіски</Link>
            </li>
            <li className={styles.footerListItem}>
              <Link href="/category/ring">Ланцюжки</Link>
            </li>
          </ul>
        </div>
        <div className={`${styles.footerContacts}  ${styles.footerCol}`}>
          <h3 className={styles.footerCategoryTitle}>Контакти</h3>
          <ul className={styles.footerList}>
            <li className={styles.footerListItem}>Корець, вул. Старомонастирська, 1</li>
            <li className={styles.footerListItem}>380935492985</li>
            <li className={styles.footerListItem}>daisy.jewellery@gmail.com</li>
            <li className={styles.footerListItem}>
              <div className={styles.footerSocials}>
                <IconButton className={styles.social}>
                  <InstagramIcon />
                </IconButton>
                <IconButton className={styles.social}>
                  <TelegramIcon />
                </IconButton>
                <IconButton className={styles.social}>
                  <FacebookIcon />
                </IconButton>
              </div>
            </li>
          </ul>
        </div>
        <div className={`${styles.footerInfo}  ${styles.footerCol}`}>
          <h3 className={styles.footerCategoryTitle}>Інформація</h3>
          <ul className={styles.footerList}>
            <li className={styles.footerListItem}>
              <Link href="/category/ring">Повернення та обмін</Link>
            </li>
            <li className={styles.footerListItem}>
              <Link href="/category/ring">Доставка та оплата</Link>
            </li>
            <li className={styles.footerListItem}>
              <Link href="/category/ring">PRIVACY POLICY</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className={styles.footerBottomText}>© 2024 DAISY.JEWELLERY</div>
  </footer>
  );
}
