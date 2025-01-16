import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import Navigation from '../Navigation/page';
import CartDrawler from '../Cart/Cart';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import LanguageSwitcher from '../LanguageSwitcher';
import { IconButton } from '@mui/material';

import MobileMenu from '../Menu/MobileMenu';

import styles from './styles.module.css';

export default async function Header({ lang }) {
  const deviceType = headers().get('x-device-type');
  const isMobile = deviceType === 'mobile';

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <div>
          <MobileMenu isMobile={isMobile} />
        </div>
        <Link href={`/${lang}`} className={styles.logoContainer}>
          <Image
            src="/logo_black.png"
            alt="logo"
            width={100}
            height={65}
            className={styles.logo}
          />
        </Link>
        <div className={styles.headerActions}>
          <IconButton className={styles.searchButton} aria-label="Search button">
            <SearchOutlinedIcon className={styles.searchIcon} />
          </IconButton>
          <IconButton className={styles.favoritesButton} aria-label="Favorites button">
            <FavoriteBorderOutlinedIcon className={styles.favoritesIcon} />
          </IconButton>
          <CartDrawler />
          <LanguageSwitcher />
        </div>
        {/* <CartDrawler /> */}
      </div>
      <Navigation isMobile={isMobile} lang={lang} />
    </header>
  );
}
