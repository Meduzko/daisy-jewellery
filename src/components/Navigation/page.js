"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import styles from './styles.module.css';

const navList = [
  { title: 'Каблучки', href: '/category/ring/page/1' },
  { title: 'Сережки', href: '/category/earring/page/1' },
  { title: 'Кольє', href: '/category/necklace/page/1' },
  { title: 'Браслети', href: '/category/bracer/page/1' }
];

export default function Navigation({ isMobile }) {
  const [active, setActive] = useState('');

  useEffect(() => {
    const currentPath = window.location.pathname;
    const navPaths = navList.map(i => i.href);

    if (active) {
      return;
    }

    if (navPaths.includes(currentPath)) {
      const activeItem = navList.find(i => i.href === currentPath);
      if (activeItem) {
        setActive(activeItem.title);
      }
    } else {
      setActive('');
    }
  }, [active]);

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
              href={item.href}
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