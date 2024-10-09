"use client";
import styles from './styles.module.css';

export default function BuyButton({ item }) {
  const handleBtnClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('BuyButton clicked', item);
  };

  return (
      <button
        onClick={handleBtnClick}
        className={styles.buyButton}
      >
        Купити
      </button>
  )
};
