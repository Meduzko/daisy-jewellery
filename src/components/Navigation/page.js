"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getMenuItems } from '../../helpers/menuItems';

import styles from './styles.module.css';

export default function Navigation({ isCompact, lang }) {
  const [active, setActive] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navList = getMenuItems(lang);

  useEffect(() => {
    const currentPath = window.location.pathname;
    const navPaths = navList.map(i => i.link);

    if (active) {
      return;
    }

    if (navPaths.includes(currentPath)) {
      const activeItem = navList.find(i => i.link === currentPath);
      if (activeItem) {
        setActive(activeItem.title);
      }
    } else {
      setActive('');
    }
  }, [active, navList]);

  const collapsed = isMobile || isCompact;

  const onClick = (item) => {
    setActive(item.title);
  };

  return (
    <nav className={styles.nav} style={{
      maxHeight: collapsed ? 0 : 80,
      display: collapsed ? 'none' : 'flex',
      overflow: 'hidden',
      transition: 'max-height 240ms cubic-bezier(0.22, 1, 0.36, 1)'
    }}>
      <ul className={styles.navList}>
        {navList.map(item => (
          <li
            className={`${styles.navItem} ${active === item.title ? styles.active : '' }`}
            key={item.title}
          >
            <Link
              href={item.link}
              className={styles.navLink}
              onClick={() => onClick(item)}
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}