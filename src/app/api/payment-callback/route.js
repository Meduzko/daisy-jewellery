import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { sendFacebookEvent } from '../../../lib/facebookCapi';
import { parseFormUrlEncoded } from '../../../lib/liqpayFormBody';
import { requestToCapiReq } from '../../../lib/nextRequestForCapi';

export async function POST(request) {
  try {
    const raw = await request.text();
    const form = parseFormUrlEncoded(raw);
    let data = form.data;
    let signature = form.signature;

    if (data == null && raw.trim().startsWith('{')) {
      try {
        const j = JSON.parse(raw);
        data = j.data;
        signature = j.signature;
      } catch {
        /* not JSON */
      }
    }

    if (!data || !signature) {
      return NextResponse.json({ message: 'Missing data or signature' }, { status: 400 });
    }

    const privateKey = process.env.LIQPAY_PRIVATE_KEY;
    const hash = crypto.createHash('sha1');
    hash.update(privateKey + data + privateKey);
    const generatedSignature = hash.digest('base64');

    if (generatedSignature !== signature) {
      console.error('payment-callback: signature mismatch');
      return NextResponse.json({ message: 'Payment status updated' });
    }

    let decodedData;
    try {
      decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    } catch (e) {
      console.error('payment-callback: invalid payment data', e.message);
      return NextResponse.json({ message: 'Invalid payment data' }, { status: 400 });
    }

    console.log('decodedData', decodedData);

    if (decodedData?.status === 'success' && decodedData.info) {
      let decodedDataInfo;
      try {
        decodedDataInfo =
          typeof decodedData.info === 'object'
            ? decodedData.info
            : JSON.parse(decodedData.info);
      } catch (e) {
        console.error('payment-callback: invalid info JSON', e.message);
        decodedDataInfo = null;
      }

      if (decodedDataInfo) {
        console.log('orderData', decodedDataInfo);

        const apiBase =
          process.env.INTERNAL_API_URL || new URL(request.url).origin;

        await fetch(`${apiBase}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...decodedDataInfo,
            paidInfo: { order_id: decodedData.order_id },
          }),
        });

        const capReq = requestToCapiReq(request);
        try {
          const { formData, cartItems, totalPrice } = decodedDataInfo || {};
          const contents = Array.isArray(cartItems)
            ? cartItems.map((it) => ({
                id: it?.sku || it?.code || '',
                quantity: 1,
                item_price: Number(it?.price) || 0,
              }))
            : [];

          await sendFacebookEvent({
            eventName: 'Purchase',
            eventId: decodedData?.order_id,
            eventSourceUrl: process.env.SITE_DOMAIN || process.env.NEXT_PUBLIC_BASE_URL,
            customData: {
              currency: 'UAH',
              value: Number(totalPrice) || Number(decodedData?.amount) || 0,
              contents,
              content_type: 'product',
              order_id: decodedData?.order_id,
            },
            userData: {
              email: formData?.email,
              phone: formData?.phone,
              firstName: formData?.firstName,
              lastName: formData?.lastName,
            },
            req: capReq,
          });
        } catch (capErr) {
          console.error('Facebook CAPI Purchase error:', capErr);
        }
      }
    } else {
      console.error('Something went wrong during payment, decodedData:', decodedData);
    }

    return NextResponse.json({ message: 'Payment status updated' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Payment callback failed' }, { status: 500 });
  }
}
