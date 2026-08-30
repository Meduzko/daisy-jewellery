import { uploadOrderToDntrade } from '../../lib/dntradeOrder';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { formData, cartItems, totalPrice, paidInfo, orderData } = req.body;
    const payload = orderData && typeof orderData === 'object'
      ? { ...orderData, paidInfo: paidInfo || orderData.paidInfo || {} }
      : { formData, cartItems, totalPrice, paidInfo };

    if (!payload.formData || typeof payload.formData !== 'object') {
      return res.status(400).json({ error: 'Missing formData' });
    }

    if (!Array.isArray(payload.cartItems) || payload.cartItems.length === 0) {
      return res.status(400).json({ error: 'Missing cart items' });
    }

    const result = await uploadOrderToDntrade(payload);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in /api/order:', error);
    return res.status(error.status || 500).json({
      error: error.message || 'Internal Server Error',
      details: error.body
    });
  }
}
