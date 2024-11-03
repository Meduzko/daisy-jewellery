"use client";
import React, { useState, useEffect, useContext } from 'react';
import { CartContext } from '../../../context/CartContext';
import styles from './ProductCounter.module.css';

const ProductCounter = ({
  initialCount = 1,
  minCount = 1,
  maxCount = 99,
  onCountChange,
  cartItem
}) => {
  const { changeItemQuantity } = useContext(CartContext);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    // Ensure initialCount is within bounds
    if (initialCount < minCount) {
      setCount(minCount);
    } else if (initialCount > maxCount) {
      setCount(maxCount);
    } else {
      setCount(initialCount);
    }
  }, [initialCount, minCount, maxCount]);

  const handleDecrement = () => {
    if (count > minCount) {
      const newCount = count - 1;
      setCount(newCount);
      if (onCountChange) {
        onCountChange(newCount);
      }
      if (cartItem) {
        changeItemQuantity(cartItem, newCount)
      }
    }
  };

  const handleIncrement = () => {
    if (count < maxCount) {
      const newCount = count + 1;
      setCount(newCount);
      if (onCountChange) {
        onCountChange(newCount);
      }
      if (cartItem) {
        changeItemQuantity(cartItem, newCount)
      }
    }
  };

  return (
    <div className={styles.counterContainer}>
      <button
        className={styles.button}
        onClick={handleDecrement}
        disabled={count <= minCount}
        aria-label="Decrease quantity"
      >
        -
      </button>
      <span className={styles.count}>{count}</span>
      <button
        className={styles.button}
        onClick={handleIncrement}
        disabled={count >= maxCount}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
};

export default ProductCounter;
