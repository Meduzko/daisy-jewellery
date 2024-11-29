// pages/api/liqpayToken.js

import crypto from 'crypto';

export default async function handler(req, res) {
  const { amount, userData } = req.body;

  const public_key = process.env.LIQPAY_PUBLIC_KEY;
  const private_key = process.env.LIQPAY_PRIVATE_KEY;

  const liqpayParams = {
    public_key,
    version: '3',
    action: 'pay',
    amount,
    currency: 'UAH',
    description: 'Payment for services',
    order_id: `order_${Date.now()}`,
    // Include additional data if needed
  };

  const data = Buffer.from(JSON.stringify(liqpayParams)).toString('base64');
  const signature = crypto
    .createHash('sha1')
    .update(private_key + data + private_key)
    .digest('base64');

  // Request a checkout token from LiqPay
  const response = await fetch('https://www.liqpay.ua/api/3/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, signature }),
  });

  const result = await response.json();

  if (result.status === 'success') {
    const checkoutToken = result.checkout_token;
    const paymentUrl = `https://www.liqpay.ua/en/checkout/card/${checkoutToken}`;
    res.status(200).json({ paymentUrl });
  } else {
    res.status(400).json({ error: result.err_description || 'Failed to get checkout token' });
  }
};
