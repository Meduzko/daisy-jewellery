"use client";

import Link from "next/link"
import { usePathname } from 'next/navigation';
import { IconButton } from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import FacebookIcon from '@mui/icons-material/Facebook';
import styles from './styles.module.css';

const pagesWithoutFooter = ['/order', '/returns', '/payment-success'];

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
              <Link href="/category/ring/page/1">Каблучки</Link>
            </li>
            <li className={styles.footerListItem}>
              <Link href="/category/earring/page/1">Сережки</Link>
            </li>
            <li className={styles.footerListItem}>
              <Link href="/category/necklace/page/1">Кольє</Link>
            </li>
            <li className={styles.footerListItem}>
              <Link href="/category/bracer/page/1">Браслет</Link>
            </li>
          </ul>
        </div>
        <div className={`${styles.footerContacts}  ${styles.footerCol}`}>
          <h3 className={styles.footerCategoryTitle}>Контакти</h3>
          <ul className={styles.footerList}>
            <li className={styles.footerListItem}>м. Корець, площа Київська 3/3</li>
            <li className={styles.footerListItem}>+380935492985</li>
            <li className={styles.footerListItem}>daisyjewellery.info@gmail.com</li>
            <li className={styles.footerListItem}>
              <div className={styles.footerSocials}>
                <Link href="https://www.instagram.com/daisy.jewellery">
                  <IconButton className={styles.social}>
                    <InstagramIcon />
                  </IconButton>
                </Link>
                <IconButton className={styles.social}>
                  <TelegramIcon />
                </IconButton>
                <Link href="https://www.facebook.com/profile.php?id=100085472847797">
                  <IconButton className={styles.social}>
                    <FacebookIcon />
                  </IconButton>
                </Link>
              </div>
            </li>
          </ul>
        </div>
        <div className={`${styles.footerInfo}  ${styles.footerCol}`}>
          <h3 className={styles.footerCategoryTitle}>Інформація</h3>
          <ul className={styles.footerList}>
            <li className={styles.footerListItem}>
              <Link href="/returns">Повернення та обмін</Link>
            </li>
            <li className={styles.footerListItem}>
              <Link href="/delivery">Доставка та оплата</Link>
            </li>
            <li className={styles.footerListItem}>
              <Link href="/">PRIVACY POLICY</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className={styles.footerBottomText}>© 2024 DAISY.JEWELLERY</div>
  </footer>
  );
}
