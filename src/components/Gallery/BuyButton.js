"use client";

import React, { useContext, useState } from 'react';
import { Dialog, IconButton } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { CartContext } from '../../context/CartContext';
import { getProductSizes } from '../../actions/fetchProduct';
import SizeSelector from '../ProductPage/sizeSelector/sizeSelector';

import styles from './styles.module.css';

export default function BuyButton({ item, showSizes, lang }) {
  const buyButtonLabel = lang === 'ru' ? 'Купить' : 'Купити';
  const cancelLabel = lang === 'ru' ? 'Отмена' : 'Скасувати';
  const confirmLabel = lang === 'ru' ? 'Добавить в корзину' : 'Додати до кошика';
  const RING_CATEGORY_ID = process.env.NEXT_PUBLIC_RING_CATEGORY_ID || '19752BCE-1FE4-4941-B53C-9A42DF10888B';
  const { addToCart, setCartOpen } = useContext(CartContext);
  const [open, setOpen] = useState(false);
  const [sizes, setSizes] = useState([]);

  const handleClose = () => setOpen(false);

  const getSizes = async () => {
    try {
      const sizes = await getProductSizes(item.sku, RING_CATEGORY_ID);
      if (!sizes || sizes.length === 0) {
        console.warn('No sizes found for this product.');
        return;
      }

      return sizes;
    } catch (err) {
      console.error('Error handling Buy button click:', err);
    }
  };

  const handleBtnClick = async (event) => {
    if (showSizes) {
      const fetchedSizes = await getSizes();

      if (fetchedSizes?.length > 0) {
        setSizes(fetchedSizes);
        setOpen(true)

        return;
      }
    }

    addToCart(item);
    setCartOpen(true);
  };


  const handleConfirmSize = () => {
    addToCart(item);
    setCartOpen(true);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={handleBtnClick}
        className={styles.buyButton}
      >
        {buyButtonLabel}
      </button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="size-dialog-title"
        className={styles.sizeDialog}
        PaperProps={{
          className: styles.dialogPaper
        }}
      >
        <div className={styles.dialogHeader}>
          <div className={styles.dialogTitleWrapper}>
            <span className={styles.dialogAccent}>◇</span>
            <h2 id="size-dialog-title" className={styles.dialogTitle}>
              Оберіть розмір
            </h2>
            <div className={styles.dialogDivider}>
              <span className={styles.dividerLine} />
            </div>
          </div>
          <IconButton 
            onClick={handleClose} 
            className={styles.dialogClose}
            aria-label="Close"
          >
            <CloseRoundedIcon />
          </IconButton>
        </div>

        <div className={styles.dialogContent}>
          <SizeSelector item={item} sizes={sizes} />
        </div>

        <div className={styles.dialogActions}>
          <button 
            onClick={handleClose} 
            className={styles.dialogCancelBtn}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirmSize}
            className={styles.dialogConfirmBtn}
          >
            {confirmLabel}
          </button>
        </div>
      </Dialog>
    </>
  );
};
