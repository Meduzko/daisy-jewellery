"use client";

import Link from "next/link"
import { usePathname } from 'next/navigation';
import { IconButton } from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import FacebookIcon from '@mui/icons-material/Facebook';
import styles from './styles.module.css';
import { getMenuItems } from '../../helpers/menuItems';

const pagesWithoutFooter = ['/order', '/returns', '/payment-success', '/about', '/contact'];

export default function Footer() {
  const pathname = usePathname();
  const isFooterHidden = pagesWithoutFooter.includes(pathname);
  const menuItems = getMenuItems();

  if (isFooterHidden) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={`${styles.footerCategories} ${styles.footerCol}`}>
          <h3 className={styles.footerCategoryTitle}>Категорії</h3>
          <ul className={styles.footerList}>
            {menuItems.map(item => (
              <li
                className={styles.footerListItem}
                key={item.title}
              >
                <Link href={item.link}>
                  {item.title}
                </Link>
              </li>
            ))}
            <li className={styles.footerListItem}>
              <Link href="/blog">Блог</Link>
            </li>
          </ul>
        </div>
        <div className={`${styles.footerContacts}  ${styles.footerCol}`}>
          <h3 className={styles.footerCategoryTitle}>Контакти</h3>
          <ul className={styles.footerList}>
            <li className={styles.footerListItem}>м. Корець, площа Київська 3/3</li>
            <li className={styles.footerListItem}>
              <a href="tel:+380935492986">+380935492986</a>
            </li>
            <li className={styles.footerListItem}>
              <a href="mailto:daisyjewellery.info@gmail.com">daisyjewellery.info@gmail.com</a>
            </li>
            <li className={styles.footerListItem}>
              <div className={styles.footerSocials}>
                <Link href="https://www.instagram.com/daisy.jewellery" aria-label="Instagram link">
                  <IconButton className={styles.social} aria-label="Instagram">
                    <InstagramIcon />
                  </IconButton>
                </Link>
                <IconButton className={styles.social} aria-label="Telegram">
                  <TelegramIcon />
                </IconButton>
                <Link href="https://www.facebook.com/profile.php?id=100085472847797" aria-label="Facebook link">
                  <IconButton className={styles.social} aria-label="Facebook">
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
              <Link href="/oferta">Публічна оферта</Link>
            </li>
            <li className={styles.footerListItem}>
              <Link href="/about">Про нас</Link>
            </li>
            <li className={styles.footerListItem}>
              <Link href="/contact">Контакти</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className={styles.footerBottomText}>© 2025 DAISY.JEWELLERY</div>
  </footer>
  );
}
