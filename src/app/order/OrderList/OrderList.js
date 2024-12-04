"use client";

import React, { useContext, useEffect, useRef, useState } from 'react';
import { List, ListItem, Divider } from '@mui/material';
import { CartContext } from '../../../context/CartContext';
import ProductBuyButton from '../../../components/Buttons/ProductBuy/ProductBuy';

import styles from './styles.module.css';

const OrderList = ({
  handleSubmit,
  setShowModal,
  // email,
  // payment,
  // phone,
  formData,
  orderDescription,
  triggerValidation,
  validateForm
}) => {
  const { cartItems, getTotalPrice, getItemSize } = useContext(CartContext);
  const totalPrice = getTotalPrice();
  const fixedPrice = totalPrice.toFixed(2);
  const { email, payment, phone } = formData;
  const paymentByCard = payment === 'liqPay';

  const widgetRef = useRef();

  const [showBuyButton, setShowBuyButton] = useState(true);

  const getOrderData = () => {
    const totalPrice = getTotalPrice();
    const cartItemsWithSize = cartItems.map(item => {
      const { code, sku, title, short_description, price, image_path } = item;
      const size = getItemSize(item);
      const baseItem = {
        code,
        sku,
        title,
        short_description,
        price,
        image_path
      }

      if (size) {
        return {
          ...baseItem,
          size
        }
      }

      return baseItem;
    });

    return {
      formData,
      cartItems: cartItemsWithSize,
      totalPrice
    };
  };

  useEffect(() => {
    if (!paymentByCard) {
      widgetRef.current = false;
      setShowBuyButton(true);
      const parentElement = document.getElementById('liqpay_checkout');
      parentElement.innerHTML = '';
    }
  }, [paymentByCard]);

  const getItemPrice = (item) => {
    if (item?.quantity > 1) {
      return parseFloat((Number(item.price) * item.quantity).toFixed(2));
    }

    return item.price;
  };

  const handlePaymentRender = async () => {
    try {
      if (widgetRef.current) return;

      widgetRef.current = true;

      const orderedItemsInfo = cartItems.map(item => `Назва: ${item.title}, код: ${item.code}, розмір: ${item.size || ''}, ціна: ${item.price}`);
      const orderData = getOrderData();
  
      // Request data and signature from the API
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: fixedPrice,
          description: `${orderDescription}, товари: ${orderedItemsInfo.join(',')}, телефон: ${phone}`,
          email,
          orderData: orderData,
          // sender_first_name: firstName,
          // sender_last_name: lastName,
          info: `${orderDescription}, товари: ${orderedItemsInfo.join(',')}, телефон: ${phone}`
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const { data, signature } = result;

        // Load the LiqPay checkout script
        const script = document.createElement('script');
        script.src = 'https://static.liqpay.ua/libjs/checkout.js';
        script.async = true;
        script.onload = () => {
          window.LiqPayCheckout.init({
            data,
            signature,
            embedTo: '#liqpay_checkout',
            mode: 'embed', // Use 'popup' for popup mode
            // mode: 'popup', // Use 'popup' for popup mode
            language: 'ua'
          })
            .on('liqpay.callback', function (data) {
              console.log('liqpay.callback', data);
              setShowModal(true);
              // handleSubmit(null, data);
            });
            // .on('liqpay.ready', function (data) {
            //   // Widget is ready
            // })
            // .on('liqpay.close', function (data) {
            //   // Widget is closed
            // });
        };
        document.body.appendChild(script);
      } else {
        console.error('Error fetching payment data:', result.error);
        alert('Error initiating payment: ' + result.error);
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Error initiating payment. Please try again.');
    }
  };

  const handleSubmitClick = (e) => {
    const isFormValid = validateForm();
    console.log('handleSubmitClick HERE UPDATED!');

    if (paymentByCard) {
      if (isFormValid) {
        setShowBuyButton(false);
        handlePaymentRender();
      } else {
        triggerValidation();
      }
    } else {
      handleSubmit(e);
    }
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
                  {/* <Link href={`/category/ring/${item.id}`}></Link> */}
                  <h4 className={styles.itemTitle}>{item.title}</h4>
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

      {showBuyButton && <ProductBuyButton type="submit" width='100%' onClick={handleSubmitClick} />}

      <div style={{ zIndex: 200, position: 'relative' }}>
        <div id="liqpay_checkout"></div>
      </div>


      {/* WORKED */}
      {/* <div className={styles.submitButton}>
        {paymentByCard ?
          <PaymentForm
            amount={fixedPrice}
            description="test"
            email={email}
            handleSubmit={handleSubmit}
          /> :
          <ProductBuyButton type="submit" width='100%' onClick={handleSubmit} />}
      </div> */}
    </div>
  );
};



export default OrderList;
