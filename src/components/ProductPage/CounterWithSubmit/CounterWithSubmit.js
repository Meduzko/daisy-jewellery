"use client";

import React, { useState, useContext } from 'react';
import { CartContext } from '../../../context/CartContext';
import ProductCounter from '../counter/productCounter';
import ProductBuyButton from '../../Buttons/ProductBuy/ProductBuy';
import { trackFacebookEvent } from '../../../helpers/fbpixel';

import styles from './styes.module.css';

const CounterWithSubmit = ({ product }) => {
  const { cartItems, addToCart, setCartOpen } = useContext(CartContext);
  const [count, setCount] = useState(1);
  const cartItem = cartItems.find((item) => item.product_id === product.product_id);

  const handleButtonClick = () => {
    setCartOpen(true);

    if (!cartItem) {
      addToCart(product, count);
      try {
        trackFacebookEvent('AddToCart', {
          content_ids: [product.sku || product.code || product.product_id].filter(Boolean),
          content_type: 'product',
          content_name: product.title,
          value: Number(product.price) * (count || 1),
          currency: 'UAH'
        });
      } catch (e) {}
    }
  };

  return (
    <>
      <div className={styles.productInfoContainer}>
        <h3>Кількість:</h3>
        <ProductCounter
          initialCount={cartItem?.quantity ?? count}
          minCount={1}
          maxCount={10}
          onCountChange={setCount}
          cartItem={cartItem}
        />
      </div>
      <ProductBuyButton
        onClick={handleButtonClick}
      />
    </>
  );
};

export default CounterWithSubmit;
