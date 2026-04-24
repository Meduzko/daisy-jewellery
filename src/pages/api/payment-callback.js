import crypto from 'crypto';
import { sendFacebookEvent } from '../../lib/facebookCapi';
import { getPendingOrder } from '../../lib/pendingOrderStore';

/** LiqPay posts x-www-form-urlencoded. Using querystring/URLSearchParams turns '+' into spaces and breaks base64 in `data`. */
function parseFormUrlEncoded(raw) {
  const out = {};
  if (!raw) return out;
  for (const part of raw.split('&')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    const key = decodeURIComponent(part.slice(0, i));
    const value = decodeURIComponent(part.slice(i + 1));
    out[key] = value;
  }
  return out;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function parseLiqPayInfo(info) {
  if (info == null || info === '') return null;
  if (typeof info === 'object') return info;
  try {
    return JSON.parse(info);
  } catch (e) {
    console.error('payment-callback: invalid LiqPay info JSON', {
      message: e.message,
      length: typeof info === 'string' ? info.length : 0,
      sampleEnd: typeof info === 'string' ? info.slice(-120) : ''
    });
    return null;
  }
}

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  try {
    const raw = await readRequestBody(req);
    const form = parseFormUrlEncoded(raw);
    let data = form.data;
    let signature = form.signature;
    if (data == null && raw.trim().startsWith('{')) {
      try {
        const j = JSON.parse(raw);
        data = j.data;
        signature = j.signature;
      } catch (_) {
        /* not JSON */
      }
    }

    if (!data || !signature) {
      console.error('payment-callback: missing data or signature');
      return res.status(400).json({ message: 'Missing data or signature' });
    }

    const privateKey = process.env.LIQPAY_PRIVATE_KEY;

    // Generate signature
    const hash = crypto.createHash('sha1');
    hash.update(privateKey + data + privateKey);
    const generatedSignature = hash.digest('base64');

    // Compare signatures
    if (generatedSignature === signature) {
      let decodedData;
      try {
        decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
      } catch (e) {
        console.error('payment-callback: invalid base64/data JSON from LiqPay', e.message);
        return res.status(400).json({ message: 'Invalid payment data' });
      }
      // Process payment
      console.log('decodedData', decodedData);

      if (decodedData?.status === 'success') {
        const decodedDataInfo = parseLiqPayInfo(decodedData.info);
        const storedOrder = await getPendingOrder(decodedData.order_id);
        const orderForFulfillment = storedOrder || decodedDataInfo;
        if (!orderForFulfillment) {
          console.error('payment-callback: missing stored order and invalid LiqPay info; email/CAPI skipped', {
            order_id: decodedData.order_id
          });
        } else {
          console.log('orderData', { fromStore: Boolean(storedOrder), liqPayInfo: decodedDataInfo });

          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...orderForFulfillment,
              paidInfo: { order_id: decodedData.order_id }
            }),
          });

          try {
            const { formData, cartItems, totalPrice } = orderForFulfillment || {};
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
      console.log('AFTER PAYMENT REDIRECT SUCCESSFULLY status');
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update payment status' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Payment callback failed' });
  }
};
