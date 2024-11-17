"use client";
import { useContext  } from 'react';
import Link from 'next/link';
import { List, ListItem, Divider } from '@mui/material';
// import { CartContext } from '../../../context/CartContext';
import { CartContext } from '../../../context/CartContext';
import ProductBuyButton from '../../../components/Buttons/ProductBuy/ProductBuy';

import styles from './styles.module.css';

const OrderList = ({ handleSubmit }) => {
  const { cartItems, getTotalPrice, getItemSize } = useContext(CartContext);
  const totalPrice = getTotalPrice();
  const fixedPrice = totalPrice.toFixed(2);

  const getItemPrice = (item) => {
    if (item?.quantity > 1) {
      return parseFloat((Number(item.price) * item.quantity).toFixed(2));
    }

    return item.price;
  };

  return (
    <div className={styles.orderListContainer}>
      <List className={styles.orderList}>
        {cartItems.map((item, index) => {
          const price = getItemPrice(item);
          const size = getItemSize(item);

          return (
            <ListItem key={index} className={styles.cartListItem} divider>
              <div className={styles.basketItemContainer}>
                <div className={styles.basketImageContainer}>
                <picture>
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className={styles.basketImage}
                  />
                </picture>
                </div>
                <div className={styles.itemDetails}>
                  <Link href={`/category/ring/${item.id}`}>
                    <h4 className={styles.itemTitle}>{item.title}</h4>
                  </Link>
                  <div className={styles.price}>{`${price} грн`}</div>
                  {size && (
                    <div>{`Розмір: ${size}`}</div>
                  )}
                  <div>{`Кількість: ${item.quantity}`}</div>
                </div>
              </div>
            </ListItem>
          )
        })}
      </List>
      <div className={styles.orderSummary}>
        <div className={styles.summaryItem}>
          <p>Доставка</p>
          <p className={styles.deliveryTax}>{`За тарифами 'Нової Пошти' - від 70 грн`}</p>
        </div>
      </div>
      <Divider />
      <div className={styles.totalSum}>
        <p className={styles.totalSumTitle}>Загалом</p>
        <p className={styles.totalSumPrice}>{`${fixedPrice} грн`}</p>
      </div>

      <div className={styles.submitButton}>
        <ProductBuyButton type="submit" width='100%' onClick={handleSubmit} />
      </div>
    </div>
  );
};

export default OrderList;
