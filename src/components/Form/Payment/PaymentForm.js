'use client';

export default function PaymentForm({ amount, description, email }) {
  const handlePayment = async () => {
    try {

      console.log('PAYMENT FORM amount', amount);
      // Request data and signature from the API
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description, email }),
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
            language: 'en',
          })
            .on('liqpay.callback', function (data) {
              console.log('Payment Status:', data.status);
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

  return (
    <div style={{ zIndex: 200, position: 'relative' }}>
      <h1>Review Your Order</h1>
      <p>Amount: {amount} UAH</p>
      <p>Description: {description}</p>
      {/* Add other order details as needed */}
      <div id="liqpay_checkout"></div>
      <button onClick={handlePayment}>Pay with LiqPay</button>
    </div>
  );
}
