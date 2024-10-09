"use client";
import styles from './styles.module.css';

export default function ProductBuyButton({ disabled, onClick, text='КУПИТИ', width='auto' }) {

  const handleBtnClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('BuyButton clicked');
    onClick?.();
  };

  return (
    <button
      variant="contained"
      className={styles.buyButton}
      onClick={handleBtnClick}
      disabled={disabled}
      style={{ width }}
    >
      {text}
    </button>
  )
};
