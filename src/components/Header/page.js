"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import CartDrawler from '../Cart/Cart';
import LanguageSwitcher from '../LanguageSwitcher';
import Search from './Search/Search';
import MobileMenu from '../Menu/MobileMenu';
import { getMenuItems } from '../../helpers/menuItems';
import { getHomeCopy } from '../Home/copy';

import styles from './styles.module.css';

export default function Header({ lang }) {
  const locale = lang === 'ru' ? 'ru' : 'uk';
  const pathname = usePathname();
  const copy = getHomeCopy(locale);
  const menuItems = getMenuItems(locale);
  const navItems = [
    ...menuItems,
    { title: copy.nav.about, link: `/${locale}/about`, muted: true },
  ];

  return (
    <>
      <div className={styles.topBar}>
        {/* Outer moves by bar width, inner by its own width: text enters fully from the left and exits fully right. */}
        <div className={styles.marquee}>
          <p className={styles.marqueeItem}>
            <span>{copy.topBar[0]}</span>
            <span className={styles.topBarDot} aria-hidden="true" />
            <span>{copy.topBar[1]}</span>
          </p>
        </div>
      </div>

      <header className={styles.header}>
        <div className={styles.bar}>
          <div className={styles.menu}>
            <MobileMenu lang={locale} />
          </div>

          <Link href={`/${locale}`} className={styles.logo} aria-label={copy.header.home}>
            <Image
              src="/logo_wordmark.png"
              alt="Daisy Jewellery"
              width={900}
              height={350}
              priority
              className={styles.logoImg}
            />
          </Link>

          <nav className={styles.nav} aria-label={copy.header.mainNav}>
            <ul className={styles.navList}>
              {navItems.map((item) => {
                const section = item.link.split('/')[2];
                const isActive = section && pathname?.split('/')[2] === section;
                return (
                  <li key={item.link}>
                    <Link
                      href={item.link}
                      className={`${styles.navLink} ${item.muted ? styles.navLinkMuted : ''} ${isActive ? styles.navLinkActive : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={styles.search}>
            <Search lang={locale} />
          </div>

          <div className={styles.cart}>
            <CartDrawler lang={locale} />
          </div>

          <div className={styles.lang}>
            <LanguageSwitcher />
          </div>
        </div>
      </header>
    </>
  );
}
