"use client";

import styles from './styles.module.css';

export default function ProductBuyButton({
  disabled,
  onClick,
  text='КУПИТИ',
  width='auto',
  ...rest
}) {

  const handleBtnClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick?.(event);
  };

  return (
    <button
      variant="contained"
      className={styles.buyButton}
      onClick={handleBtnClick}
      disabled={disabled}
      style={{ width }}
      {...rest}
    >
      {text}
    </button>
  )
};
