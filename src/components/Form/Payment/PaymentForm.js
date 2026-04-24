'use client';

import React, { useEffect, useRef } from 'react';

/** orderData: full { formData, cartItems, totalPrice } — required by /api/create-payment for Redis + email after pay. */
export default function PaymentForm({ amount, description, email, handleSubmit, orderData }) {
  const widgetRef = useRef();

  useEffect(() => {
    const init = async () => {
      try {
        widgetRef.current = true;
        const response = await fetch('/api/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, description, email, orderData })
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
              language: 'ua',
            })
              .on('liqpay.callback', function (data) {
                handleSubmit(null, data);
                // Handle payment status
              })
              .on('liqpay.ready', function (data) {
                // Widget is ready
              })
              .on('liqpay.close', function (data) {
                // Widget is closed
              });
          };
          document.body.appendChild(script);
        } else {
          console.error('Error fetching payment data:', result);
          alert('Сталась помилка ініціалізації платежу: ' + (result.message || result.error || 'unknown'));
        }
      } catch (error) {
        console.error('Error initiating payment:', error);
        alert('Сталась помилка ініціалізації платежу. Спробуйте ще раз.');
      }
    };

    if (!widgetRef?.current && amount && description && email && orderData) {
      init();
    }
  }, [amount, description, email, orderData]);

  return (
    <div style={{ zIndex: 200, position: 'relative' }}>
      <div id="liqpay_checkout"></div>
    </div>
  );
}
