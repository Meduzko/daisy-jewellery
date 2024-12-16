import crypto from 'crypto';

export default async function handler(req, res) {
  try {
    const { data, signature } = req.body;
    const privateKey = process.env.LIQPAY_PRIVATE_KEY;

    // Generate signature
    const hash = crypto.createHash('sha1');
    hash.update(privateKey + data + privateKey);
    const generatedSignature = hash.digest('base64');

    // Compare signatures
    if (generatedSignature === signature) {
      // Signature is valid
      const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
      // Process payment
      console.log('decodedData', decodedData);

      if (decodedData?.status === 'success') {
        const decodedDataInfo = JSON.parse(decodedData.info);

        console.log('orderData', decodedDataInfo);

        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...decodedDataInfo, paidInfo: { order_id: decodedData.order_id } }),
        });
      } else {
        console.error('Something went wrong during payment, decodedData:', decodedData);
      }
    } else {
      // Invalid signature
      // Handle error
      console.error('Something wrong during comparing generatedSignature === signature');
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
