"use client";

import React, { useContext, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { CartContext } from '../../context/CartContext';
import { getProductSizes } from '../../actions/fetchProduct';
import SizeSelector from '../ProductPage/sizeSelector/sizeSelector';
import { trackFacebookEvent, getFacebookEventId } from '../../helpers/fbpixel';

import styles from './styles.module.css';

export default function BuyButton({ item, showSizes, lang }) {
  const buyButtonLabel = lang === 'ru' ? 'Купить' : 'Купити';
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
    try {
      const id = item?.sku || item?.code || item?.product_id;
      const price = Number(item?.price) || 0;
      const eventId = getFacebookEventId();
      trackFacebookEvent('AddToCart', {
        content_ids: [id],
        content_type: 'product',
        content_name: item?.title,
        value: price,
        currency: 'UAH'
      }, eventId);
      const payload = { id, name: item?.title, price, quantity: 1, eventId };
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon('/api/capi-addtocart', blob);
      } else {
        fetch('/api/capi-addtocart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true
        });
      }
    } catch {}
  };


  const handleConfirmSize = () => {
    addToCart(item);
    setCartOpen(true);
    setOpen(false);
    try {
      const id = item?.sku || item?.code || item?.product_id;
      const price = Number(item?.price) || 0;
      const eventId = getFacebookEventId();
      trackFacebookEvent('AddToCart', {
        content_ids: [id],
        content_type: 'product',
        content_name: item?.title,
        value: price,
        currency: 'UAH'
      }, eventId);
      const payload = { id, name: item?.title, price, quantity: 1, eventId };
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon('/api/capi-addtocart', blob);
      } else {
        fetch('/api/capi-addtocart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true
        });
      }
    } catch {}
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
