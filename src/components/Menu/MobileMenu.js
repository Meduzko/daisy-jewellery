"use client";
import React, { useState, Fragment } from 'react';
import { Drawer, List, ListItem, IconButton, Divider, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import Link from 'next/link';
import Image from 'next/image';
import { getMenuItems } from '../../helpers/menuItems';

import styles from './styles.module.css';

const MobileMenu = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const menuItems = getMenuItems();

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setIsDrawerOpen(open);
  };

  const handleMenuItemClick = () => {
    setIsDrawerOpen(false);
  };

  if (!isMobile) {
    return null;
  }

  return (
    <div>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="menu"
        onClick={toggleDrawer(true)}
        className={styles.menuButton}
      >
        <MenuOutlinedIcon className={styles.menuIcon} />
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
            <Link href="/" onClick={handleMenuItemClick} className={styles.menuLogo}>
              <Image
                src="/logo_black.png"
                alt="Daisy Jewellery"
                width={60}
                height={41}
              />
            </Link>
            <IconButton className={styles.mobileMenuClose} onClick={toggleDrawer(false)}>
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
                href="/"
                onClick={handleMenuItemClick}
              >
                <span className={styles.menuItemIcon}>✦</span>
                Головна
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
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                <InstagramIcon />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                <FacebookIcon />
              </a>
            </div>
            <p className={styles.menuTagline}>Вишукані срібні прикраси</p>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default MobileMenu;
