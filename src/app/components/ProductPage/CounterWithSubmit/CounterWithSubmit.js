"use client";
import React, { useState, useContext } from 'react';
import { CartContext } from '../../../context/CartContext';
import ProductCounter from '../counter/productCounter';
import ProductBuyButton from '../../Buttons/ProductBuy/ProductBuy';

import styles from './styes.module.css';

const CounterWithSubmit = ({ product }) => {
  const { cartItems, addToCart, setCartOpen } = useContext(CartContext);
  const cartItem = cartItems.find((item) => item.id === product.id);
  const [count, setCount] = useState(1);

  const handleButtonClick = () => {
    addToCart(product, count);
    setCartOpen(true);
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
        disabled={cartItem}
        onClick={handleButtonClick}
      />
    </>
  );
};

export default CounterWithSubmit;
