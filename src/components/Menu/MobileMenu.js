"use client";
import React, { useState } from 'react';
import { Drawer, List, ListItem, ListItemText, IconButton, Divider, useMediaQuery, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Link from 'next/link';

import styles from './styles.module.css';

const MobileMenu = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      >
        <MenuOutlinedIcon fontSize="large"/>
      </IconButton>
      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={toggleDrawer(false)}
      >
        <IconButton className={styles.mobileMenuClose} onClick={toggleDrawer(false)}>
          <CloseRoundedIcon className={styles.closeIcon} />
        </IconButton>
        <List className={styles.mobileMenuList}>
          <ListItem className={styles.mobileMenuListItem}>
            <Link
              className={styles.menuItemText}
              href="/"
              onClick={handleMenuItemClick}
            >
                Головна
            </Link>
          </ListItem>
          <Divider />
          <ListItem className={styles.mobileMenuListItem}>
            <Link
              className={styles.menuItemText}
              href="/category/ring/page/1"
              onClick={handleMenuItemClick}
            >
              Каблучки
            </Link>
          </ListItem>
          <Divider />
          <ListItem className={styles.mobileMenuListItem}>
            <Link
              className={styles.menuItemText}
              href="/category/earring/page/1"
              onClick={handleMenuItemClick}
            >
              Сережки
            </Link>
          </ListItem>
          <Divider />
          <ListItem className={styles.mobileMenuListItem}>
            <Link
              className={styles.menuItemText}
              href="/category/necklace/page/1"
              onClick={handleMenuItemClick}
            >
              Кольє
            </Link>
          </ListItem>
          <Divider />
          <ListItem className={styles.mobileMenuListItem}>
            <Link
              className={styles.menuItemText}
              href="/category/bracer/page/1"
              onClick={handleMenuItemClick}
            >
              Браслети
            </Link>
          </ListItem>
        </List>
      </Drawer>
    </div>
  );
};

export default MobileMenu;
