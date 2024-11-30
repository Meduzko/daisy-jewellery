"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMenuItems } from '../../helpers/menuItems';

import styles from './styles.module.css';

export default function Navigation({ isMobile }) {
  const [active, setActive] = useState('');
  const navList = getMenuItems();

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

  if (isMobile) {
    return null;
  }

  const onClick = (item) => {
    setActive(item.title);
  };

  return (
    <nav className={styles.nav}>
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