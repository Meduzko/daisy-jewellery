"use client";

import React, { useContext, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { CartContext } from '../../context/CartContext';
import { getProductSizes } from '../../actions/fetchProduct';
import SizeSelector from '../ProductPage/sizeSelector/sizeSelector';

import styles from './styles.module.css';

export default function BuyButton({ item, showSizes }) {
  const RING_CATEGORY_ID = process.env.NEXT_PUBLIC_RING_CATEGORY_ID;

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
        Купити
      </button>


      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Оберіть розмір
        </DialogTitle>
        <DialogContent>
          <SizeSelector item={item} sizes={sizes} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Відмінити</Button>
          <Button
            onClick={handleConfirmSize}
            variant="contained"
            autoFocus
            >
              OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
