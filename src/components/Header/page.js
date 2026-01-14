"use client";

import Link from 'next/link';
import Image from 'next/image';
import Navigation from '../Navigation/page';
import CartDrawler from '../Cart/Cart';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import LanguageSwitcher from '../LanguageSwitcher';
import { IconButton } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import MobileMenu from '../Menu/MobileMenu';

import styles from './styles.module.css';

export default function Header({ lang }) {
  const [isCompact, setIsCompact] = useState(false);
  const isCompactRef = useRef(isCompact);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const suppressScrollRef = useRef(false);
  const headerRef = useRef(null);

  useEffect(() => {
    isCompactRef.current = isCompact;
  }, [isCompact]);

  useEffect(() => {
    try {
      document.body.classList.toggle('header-compact', isCompact);
    } catch {}
    return () => {
      try {
        document.body.classList.remove('header-compact');
      } catch {}
    };
  }, [isCompact]);

  useEffect(() => {
    const ENTER_COMPACT = 120; // scrollY at which header becomes compact
    const EXIT_COMPACT = 40;   // scrollY below which header expands

    const updateOnScroll = () => {
      const currentY = window.scrollY || 0;

      const prevHeight = headerRef.current ? headerRef.current.offsetHeight : 0;

      if (!isCompactRef.current && currentY > ENTER_COMPACT) {
        isCompactRef.current = true;
        setIsCompact(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const newHeight = headerRef.current ? headerRef.current.offsetHeight : prevHeight;
            const delta = prevHeight - newHeight;
            if (delta !== 0) {
              suppressScrollRef.current = true;
              window.scrollBy(0, delta);
              requestAnimationFrame(() => { suppressScrollRef.current = false; });
            }
          });
        });
      } else if (isCompactRef.current && currentY < EXIT_COMPACT) {
        isCompactRef.current = false;
        setIsCompact(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const newHeight = headerRef.current ? headerRef.current.offsetHeight : prevHeight;
            const delta = prevHeight - newHeight;
            if (delta !== 0) {
              suppressScrollRef.current = true;
              window.scrollBy(0, delta);
              requestAnimationFrame(() => { suppressScrollRef.current = false; });
            }
          });
        });
      }

      lastScrollYRef.current = currentY;
      tickingRef.current = false;
    };

    const onScroll = () => {
      if (suppressScrollRef.current) {
        return;
      }
      if (!tickingRef.current) {
        tickingRef.current = true;
        requestAnimationFrame(updateOnScroll);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // sync initial state on mount
    updateOnScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <header ref={headerRef} className={`${styles.header} ${isCompact ? styles.compact : ''}`}>
      <div className={styles.headerContainer}>
        <div>
          <MobileMenu />
        </div>
        <Link href={`/${lang}`} className={styles.logoContainer}>
          <Image
            src="/logo_black.png"
            alt="logo"
            width={95}
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
      </div>
      <Navigation lang={lang} isCompact={isCompact} />
    </header>
  );
}
