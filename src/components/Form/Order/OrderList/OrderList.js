"use client";

import React, { useContext, useEffect, useRef, useState } from 'react';
import { List, ListItem, Divider } from '@mui/material';
import { CartContext } from '../../../../context/CartContext';
import ProductBuyButton from '../../../Buttons/ProductBuy/ProductBuy';
import { trackFacebookEvent } from '../../../../helpers/fbpixel';
import RulesPopup from '../../../Popups/RulesPopup/RulesPopup';
import { getLinePrices } from '../../../../helpers/productPricing';

import styles from './styles.module.css';

const OrderList = ({
  t,
  handleSubmit,
  formData,
  formErrors = {},
  orderDescription,
  triggerValidation,
  validateForm
}) => {
  const { cartItems, getTotalPrice, getItemSize, handleOrderSuccess } = useContext(CartContext);
  const totalPrice = getTotalPrice();
  const fixedPrice = totalPrice.toFixed(2);
  const { email, payment, phone } = formData;
  const paymentByCard = payment === 'liqPay';
  const PRICE_FOR_FREE_DELIVERY = 2500;
  const isFreeDelivery = totalPrice >= PRICE_FOR_FREE_DELIVERY;

  const widgetRef = useRef();

  const [showBuyButton, setShowBuyButton] = useState(true);
  const [showRulesPopup, setShowRulesPopup] = useState(false);

  const handleOpenRules = (e) => {
    e.preventDefault();
    setShowRulesPopup(true);
  };

  const getOrderData = () => {
    const totalPrice = getTotalPrice();
    const cartItemsWithSize = cartItems.map(item => {
      const {
        code,
        sku,
        title,
        short_description,
        price,
        image_path,
        product_id,
        quantity
      } = item;
      const size = getItemSize(item);
      const baseItem = {
        code,
        sku,
        title,
        short_description,
        price,
        image_path,
        product_id,
        quantity
      };

      if (size) {
        return {
          ...baseItem,
          size
        };
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

  const getItemPrice = (item) => getLinePrices(item);

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
            // mode: 'embed', // Use 'popup' for popup mode
            mode: 'popup', // Use 'popup' for popup mode
            language: 'ua'
          })
            .on('liqpay.callback', function (data) {
              handleOrderSuccess();
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
    const price = getTotalPrice();

    if (!price || price <= 0) {
      return;
    }

    if (paymentByCard) {
      if (isFormValid) {
        try {
          trackFacebookEvent('InitiateCheckout', {
            value: Number(fixedPrice),
            currency: 'UAH',
            num_items: cartItems?.length || 0,
            content_type: 'product'
          });
        } catch (err) {}
        setShowBuyButton(false);
        handlePaymentRender();
      } else {
        triggerValidation();
      }
    } else {
      if (isFormValid) {
        try {
          trackFacebookEvent('InitiateCheckout', {
            value: Number(fixedPrice),
            currency: 'UAH',
            num_items: cartItems?.length || 0,
            content_type: 'product'
          });
        } catch (err) {}
      }
      handleSubmit(e);
    }
  };

  return (
    <div className={styles.orderListContainer}>
      <List className={styles.orderList}>
        {cartItems.map((item, index) => {
          const { price, originalPrice, hasDiscount } = getItemPrice(item);
          const size = getItemSize(item);

          return (
            <ListItem key={index} className={styles.cartListItem} divider>
              <div className={styles.basketItemContainer}>
                <div className={styles.basketImageContainer}>
                <picture>
                  <img
                    src={item.images?.[0] || item.image_path}
                    alt={item.title}
                    className={styles.basketImage}
                  />
                </picture>
                </div>
                <div className={styles.itemDetails}>
                  {/* <Link href={`/category/ring/${item.id}`}></Link> */}
                  <h4 className={styles.itemTitle}>{item.title}</h4>
                  <div className={styles.price}>
                    {hasDiscount ? (
                      <>
                        <span className={styles.oldPrice}>{`${originalPrice} ${t.uah}`}</span>
                        <span className={styles.salePrice}>{`${price} ${t.uah}`}</span>
                      </>
                    ) : (
                      `${price} ${t.uah}`
                    )}
                  </div>
                  {size && (
                    <div>{`${t.size}: ${size}`}</div>
                  )}
                  <div>{`${t.quantity}: ${item.quantity}`}</div>
                </div>
              </div>
            </ListItem>
          )
        })}
      </List>
      <div className={styles.orderSummary}>
        {/* <div className={styles.summaryItem}>
          <p>Доставка</p>
          <p className={styles.deliveryTax}>{`За тарифами 'Нової Пошти' - від 90 грн`}</p>
        </div> */}
          <div className={styles.deliveryCtn}>
            <span>{t.delivery}</span>
            <div className={`${styles.deliveryPrice} ${isFreeDelivery ? styles.freeDeliveryPrice : ''}`}>
              <span className={`${styles.deliveryTax} ${isFreeDelivery ? styles.freeDeliveryOldText : ''}`}>
                {t.deliveryTax}
              </span>
              {isFreeDelivery && <span>{t.freeDelivery}</span>}
            </div>
          </div>
      </div>
      <Divider />
      <div className={styles.totalSum}>
        <p className={styles.totalSumTitle}>{t.total}</p>
        <p className={styles.totalSumPrice}>{`${fixedPrice} ${t.uah}`}</p>
      </div>

      {showBuyButton && <ProductBuyButton type="submit" width='100%' onClick={handleSubmitClick} text={t.submit} />}

      {Object.keys(formErrors).length > 0 && (
        <div className={styles.validationErrors} role="alert">
          <p className={styles.validationTitle}>{t.checkFields}</p>
          <ul className={styles.validationList}>
            {Object.entries(formErrors).map(([field, message]) => (
              <li key={field}>
                <strong>{t.fieldLabels[field] || field}</strong>
                {message ? ` — ${message}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className={styles.rulesText}>{t.rulesPrefix} <button type="button" className={styles.rulesLink} onClick={handleOpenRules}>{t.rulesLink}</button></p>

      <RulesPopup open={showRulesPopup} onClose={() => setShowRulesPopup(false)} />

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
