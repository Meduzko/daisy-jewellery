'use client';

import React, { useContext } from 'react';
import { CartContext } from '../../context/CartContext';
import styles from './styles.module.css';

export default function BuyButton({ item }) {
  const { addToCart, setCartOpen } = useContext(CartContext);

  const handleBtnClick = (event) => {
    addToCart(item);
    setCartOpen(true);
  };

  return (
    <button onClick={handleBtnClick} className={styles.buyButton}>
      Купити
    </button>
  );
}
