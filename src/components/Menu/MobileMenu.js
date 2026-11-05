"use client";
import React, { useState, Fragment } from 'react';
import { Drawer, List, ListItem, IconButton } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import Link from 'next/link';
import Image from 'next/image';
import { getMenuItems } from '../../helpers/menuItems';
import LanguageSwitcher from '../LanguageSwitcher';
import { getHomeCopy, SOCIAL } from '../Home/copy';

import styles from './styles.module.css';

const HOME_LABEL = { uk: 'Головна', ru: 'Главная' };
const TAGLINE = { uk: 'Вишукані срібні прикраси', ru: 'Изысканные серебряные украшения' };

// Visibility is controlled by the header CSS (hidden from 1024px).
const MobileMenu = ({ lang = 'uk' } = {}) => {
  const locale = lang === 'ru' ? 'ru' : 'uk';
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const copy = getHomeCopy(locale);
  const menuItems = [
    ...getMenuItems(locale),
    { title: copy.nav.about, link: `/${locale}/about` },
  ];

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setIsDrawerOpen(open);
  };

  const handleMenuItemClick = () => {
    setIsDrawerOpen(false);
  };

  return (
    <div>
      <IconButton
        color="inherit"
        aria-label={copy.header.menu}
        aria-expanded={isDrawerOpen}
        onClick={toggleDrawer(true)}
        className={styles.menuButton}
      >
        <svg className={styles.menuIcon} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
          <path d="M3 7h18M3 12h18M3 17h18" />
        </svg>
      </IconButton>
      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={toggleDrawer(false)}
        className={styles.drawer}
      >
        <div className={styles.drawerContent}>
          {/* Header with logo */}
          <div className={styles.menuHeader}>
            <Link href={`/${locale}`} onClick={handleMenuItemClick} className={styles.menuLogo}>
              <Image
                src="/logo_black.png"
                alt="Daisy Jewellery"
                width={60}
                height={41}
              />
            </Link>
            <IconButton className={styles.mobileMenuClose} onClick={toggleDrawer(false)} aria-label={copy.header.closeMenu}>
              <CloseRoundedIcon className={styles.closeIcon} />
            </IconButton>
          </div>

          {/* Decorative divider */}
          <div className={styles.headerDivider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerIcon}>◇</span>
            <span className={styles.dividerLine} />
          </div>

          {/* Menu items */}
          <List className={styles.mobileMenuList}>
            <ListItem className={styles.mobileMenuListItem}>
              <Link
                className={styles.menuItemText}
                href={`/${locale}`}
                onClick={handleMenuItemClick}
              >
                <span className={styles.menuItemIcon}>✦</span>
                {HOME_LABEL[locale]}
              </Link>
            </ListItem>
            {menuItems.map((item, index) => (
              <Fragment key={item.title}>
                <ListItem className={styles.mobileMenuListItem} style={{ animationDelay: `${(index + 1) * 50}ms` }}>
                  <Link
                    className={styles.menuItemText}
                    href={item.link}
                    onClick={handleMenuItemClick}
                  >
                    <span className={styles.menuItemIcon}>✦</span>
                    {item.title}
                  </Link>
                </ListItem>
              </Fragment>
            ))}
          </List>

          {/* Footer with socials */}
          <div className={styles.menuFooter}>
            <div className={styles.socialLinks}>
              <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
                <InstagramIcon />
              </a>
              <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook">
                <FacebookIcon />
              </a>
            </div>
            <div className={styles.menuLang}>
              <LanguageSwitcher />
            </div>
            <p className={styles.menuTagline}>{TAGLINE[locale]}</p>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default MobileMenu;
