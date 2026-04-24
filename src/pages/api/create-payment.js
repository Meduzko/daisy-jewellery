import crypto from 'crypto';
import { savePendingOrder } from '../../lib/pendingOrderStore';

/**
 * LiqPay: amount, currency, description, order_id, urls, payer email/phone go in signed `params`.
 * Do not put cart/form in `info` — LiqPay truncates ~1600 chars and breaks JSON.
 * Full cart + formData for /api/send-email live in Redis via savePendingOrder (same order_id).
 */
function liqPayInfoField(orderId) {
  return JSON.stringify({ o: orderId });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { amount, description, orderData } = req.body;

      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }

      if (!orderData || typeof orderData !== 'object') {
        return res.status(400).json({ message: 'orderData is required' });
      }
      const { formData, cartItems } = orderData;
      if (!formData || typeof formData !== 'object' || !String(formData.email || '').trim()) {
        return res.status(400).json({ message: 'orderData.formData with email is required' });
      }
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ message: 'orderData.cartItems must be a non-empty array' });
      }

      const orderId = Math.floor(100000 + Math.random() * 900000);
      await savePendingOrder(orderId, orderData);

      const params = {
        public_key: process.env.LIQPAY_PUBLIC_KEY,
        version: '3',
        action: 'pay',
        amount: amount.toString(),
        currency: 'UAH',
        description: description || 'Payment Description',
        order_id: orderId,
        info: liqPayInfoField(orderId, orderData),
        result_url: `${process.env.SITE_DOMAIN}/`,
        server_url: `${process.env.SITE_DOMAIN}/api/payment-callback`,
        email: String(formData.email).trim(),
        info: liqPayInfoField(orderId),
        paytypes: 'apay,gpay,card,privat24,invoice,qr',
        // localhost sandbox
        // result_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
        // server_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment-callback`,
        // sandbox: '1'
      };

      const phone = formData.phone != null ? String(formData.phone).trim() : '';
      if (phone) {
        params.phone = phone;
      }

      // Generate data and signature - old worked way
      const jsonString = JSON.stringify(params);
      const data = Buffer.from(jsonString).toString('base64');
      const concatString = process.env.LIQPAY_PRIVATE_KEY + data + process.env.LIQPAY_PRIVATE_KEY;
      const sha1Hash = crypto.createHash('sha1').update(concatString).digest();
      const signature = Buffer.from(sha1Hash).toString('base64');
 
      // Return data and signature
      res.status(200).json({ data, signature });
    }
  } catch (error) {
    console.error('Error in create-payment route:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
