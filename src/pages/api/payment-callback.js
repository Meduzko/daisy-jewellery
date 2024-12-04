// pages/api/liqpay-callback.js

import crypto from 'crypto';

export default async function handler(req, res) {
  try {
    const { data, signature } = req.body;
    // const private_key = process.env.LIQPAY_PRIVATE_KEY;
    // console.log('req.body payment-callback', req.body);
    console.log('req.body.data payment-callback', data);
  
      // Verify the signature
    // const expectedSignature = crypto
    //   .createHash('sha1')
    //   .update(private_key + data + private_key)
    //   .digest('base64');
  
    // if (signature !== expectedSignature) {
    //   res.status(400).json({ message: 'Invalid signature' });
    //   return;
    // }
  
    // // Decode and parse the data
    // const decodedData = Buffer.from(data, 'base64').toString('utf-8');
    // const paymentInfo = JSON.parse(decodedData);
  
    // // Extract necessary information
    // const { status, order_id, amount } = paymentInfo;
  
      // Update payment status in your database
      // For demonstration, we'll assume you have a function updatePaymentStatus(order_id, status)


    const privateKey = process.env.LIQPAY_PRIVATE_KEY;
    // const data = req.body.data;
    // const receivedSignature = req.body.signature;

    // Generate signature
    const hash = crypto.createHash('sha1');
    hash.update(privateKey + data + privateKey);
    const generatedSignature = hash.digest('base64');

    // Compare signatures
    if (generatedSignature === signature) {
      // Signature is valid
      const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
      // Process payment
      console.log(decodedData);

      if (decodedData) {
        const decodedDataInfo = JSON.parse(decodedData.info);

        console.log('orderData', decodedDataInfo);

        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...decodedDataInfo.orderData, paidInfo: { order_id: decodedData.order_id } }),
        });
      }

      // const response = await fetch(`${process.env.NEXTAUTH_URL}/api/send-email`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(bodyParams),
      // });
      // TODO
      // const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ ...orderData, paidInfo }),
      // });
    } else {
      // Invalid signature
      // Handle error
      console.log('something wrong during generatedSignature === signature');
    }
  
    try {
      // await updatePaymentStatus(order_id, status);
      res.status(200).json({ message: 'Payment status updated' });
      console.log('AFTER PAYMENT REDIRECT SUCCESSFULL status');
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update payment status' });
    }
  } catch (error) {
    console.error(error);
    res.status(405).json({ message: 'Method not allowed' });
  }
};
