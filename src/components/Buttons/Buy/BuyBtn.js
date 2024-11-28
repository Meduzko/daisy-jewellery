"use client";
import { useBasket  } from '../../context/BasketContext';
import styles from './styles.module.css';

export default function BuyButton({ product }) {
  const { addItemToBasket } = useBasket();

  const handleBtnClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    addItemToBasket(product);
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
