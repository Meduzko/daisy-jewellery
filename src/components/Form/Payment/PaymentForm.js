'use client';

import React, { useEffect, useRef } from 'react';

export default function PaymentForm({ amount, description, email, handleSubmit }) {
  const widgetRef = useRef();

  useEffect(() => {
    const init = async () => {
      try {
        widgetRef.current = true;
        console.log('PAYMENT FORM amount', amount);
        // Request data and signature from the API
        const response = await fetch('/api/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, description, email }), // TODO: add description.
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
              .on('liqpay.callback', function (data, ...rest) {
                console.log(rest);
                console.log('Payment Status:', data.status);
                handleSubmit();
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
          console.error('Error fetching payment data:', result.error);
          alert('Error initiating payment: ' + result.error);
        }
      } catch (error) {
        console.error('Error initiating payment:', error);
        alert('Error initiating payment. Please try again.');
      }
    };

    if (!widgetRef?.current && (amount && description && email)) {
      init();
    }
  }, [amount, description, email]);

  return (
    <div style={{ zIndex: 200, position: 'relative' }}>
      <div id="liqpay_checkout"></div>
    </div>
  );
}