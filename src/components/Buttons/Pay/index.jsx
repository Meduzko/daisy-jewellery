import { useRouter } from 'next/router';
import ProductBuyButton from '../ProductBuy/ProductBuy';

function PayButton({ amount, userData, orderID }) {
  const handleClick = async () => {
    try {
      const response = await fetch('/api/liqpayUrl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, userData, orderID }),
      });

      const result = await response.json();

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        console.error('Error:', result.error);
        alert(`Payment initiation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('An unexpected error occurred.');
    }
  };

  return (
    <ProductBuyButton id='paymentByCard' width='100%' onClick={handleClick} />
  );
}

export default PayButton;
