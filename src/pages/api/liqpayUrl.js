import crypto from 'crypto';

export default async function handler(req, res) {
  try {
    const { amount, userData, orderID } = req.body;
    const { email, firstName, lastName, cityName, department } = userData;

    const public_key = process.env.LIQPAY_PUBLIC_KEY;
    const private_key = process.env.LIQPAY_PRIVATE_KEY;
  
    const paymentDescription = `Daisy Jewellery, ${firstName} ${lastName} ${department} ${cityName} ${email}`;

    const liqpayParams = {
      public_key,
      version: '3',
      action: 'pay',
      amount,
      currency: 'UAH', // Replace with your currency if different
      description: paymentDescription || 'Payment for services',
      order_id: orderID,
      // Include user data if necessary
      email: email,
      // Callback URLs
      result_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?order_id=${orderID}`,
      server_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/liqpay-callback`,
      // Additional parameters...
      sandbox: '1'
    };
  
    const data = Buffer.from(JSON.stringify(liqpayParams)).toString('base64');
  
    const signature = crypto
      .createHash('sha1')
      .update(private_key + data + private_key)
      .digest('base64');
  
    // Generate checkout URL
    const paymentUrl = `https://www.liqpay.ua/api/3/checkout?data=${encodeURIComponent(data)}&signature=${encodeURIComponent(signature)}`;
  
    res.status(200).json({ paymentUrl });
  } catch (error) {
    res.status(400).json({ error });
  }
};
