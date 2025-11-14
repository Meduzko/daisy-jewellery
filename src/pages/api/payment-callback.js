import crypto from 'crypto';
import { sendFacebookEvent } from '../../lib/facebookCapi';

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

          // Fire Facebook Conversions API Purchase event
          try {
            const { formData, cartItems, totalPrice } = decodedDataInfo || {};
            const contents = Array.isArray(cartItems) ? cartItems.map((it) => ({
              id: it?.sku || it?.code || '',
              quantity: 1,
              item_price: Number(it?.price) || 0
            })) : [];

            await sendFacebookEvent({
              eventName: 'Purchase',
              eventId: decodedData?.order_id,
              eventSourceUrl: process.env.SITE_DOMAIN || process.env.NEXT_PUBLIC_BASE_URL,
              customData: {
                currency: 'UAH',
                value: Number(totalPrice) || Number(decodedData?.amount) || 0,
                contents,
                content_type: 'product',
                order_id: decodedData?.order_id
              },
              userData: {
                email: formData?.email,
                phone: formData?.phone,
                firstName: formData?.firstName,
                lastName: formData?.lastName
              },
              req
            });
          } catch (capErr) {
            console.error('Facebook CAPI Purchase error:', capErr);
          }
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
