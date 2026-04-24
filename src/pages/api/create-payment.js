import crypto from 'crypto';

/** Keep LiqPay `info` small — long JSON may be truncated on callback and break JSON.parse. */
function orderDataForLiqPayInfo(orderData) {
  if (!orderData) return {};
  const cap = (s, n) => (typeof s === 'string' && s.length > n ? `${s.slice(0, n)}...` : s);
  const { formData, cartItems, totalPrice } = orderData;
  const slimCart = Array.isArray(cartItems)
    ? cartItems.map((item) => ({
        code: item.code,
        sku: item.sku,
        //title: cap(item.title, 400),
        // short_description: cap(item.short_description, 500),
        price: item.price,
        // image_path: item.image_path,
        size: item.size
      }))
    : [];
  return { formData, cartItems: slimCart, totalPrice };
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { amount, description, orderData } = req.body;
      // const paymentDescription = `Daisy Jewellery, ${firstName} ${lastName} ${department} ${cityName} ${email}`;

      // Validate the amount
      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }

      const orderId = Math.floor(100000 + Math.random() * 900000);
      // NEXT_PUBLIC_BASE_URL
      // Payment parameters
      const params = {
        public_key: process.env.LIQPAY_PUBLIC_KEY,
        version: '3',
        action: 'pay',
        amount: amount.toString(), // Ensure amount is a string
        currency: 'UAH',
        description: description || 'Payment Description',
        order_id: orderId,
        result_url: `${process.env.SITE_DOMAIN}/`,
        server_url: `${process.env.SITE_DOMAIN}/api/payment-callback`,
        // localhost
        // result_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
        // server_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment-callback`,
        // Additional custom parameters
        // info: JSON.stringify({ email }),
        info: JSON.stringify(orderDataForLiqPayInfo(orderData)),
        paytypes: 'apay,gpay,card,privat24,invoice,qr',
        // Uncomment the following line for sandbox mode
        // sandbox: '1'
      };

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
