import crypto from 'crypto';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { amount, description, email } = req.body;

      // Validate the amount
      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }
  
      // Payment parameters
      const params = {
        public_key: process.env.LIQPAY_PUBLIC_KEY,
        version: '3',
        action: 'pay',
        amount: amount.toString(), // Ensure amount is a string
        currency: 'UAH',
        description: description || 'Payment Description',
        order_id: `order_id_${Date.now()}`,
        result_url: 'https://yourdomain.com/payment-success',
        server_url: 'https://yourdomain.com/api/payment-callback',
        // Additional custom parameters
        info: JSON.stringify({ email }),
        // Uncomment the following line for sandbox mode
        sandbox: '1',
      };

      // Generate data and signature
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
