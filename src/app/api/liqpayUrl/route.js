import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { amount, userData, orderID } = await request.json();
    const { email, firstName, lastName, cityName, department } = userData;

    const public_key = process.env.LIQPAY_PUBLIC_KEY;
    const private_key = process.env.LIQPAY_PRIVATE_KEY;

    const paymentDescription = `Daisy Jewellery, ${firstName} ${lastName} ${department} ${cityName} ${email}`;

    const liqpayParams = {
      public_key,
      version: '3',
      action: 'pay',
      amount,
      currency: 'UAH',
      description: paymentDescription || 'Payment for services',
      order_id: orderID,
      email: email,
      result_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?order_id=${orderID}`,
      server_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment-callback`,
      sandbox: '1',
    };

    const data = Buffer.from(JSON.stringify(liqpayParams)).toString('base64');

    const signature = crypto
      .createHash('sha1')
      .update(private_key + data + private_key)
      .digest('base64');

    const paymentUrl = `https://www.liqpay.ua/api/3/checkout?data=${encodeURIComponent(data)}&signature=${encodeURIComponent(signature)}`;

    return NextResponse.json({ paymentUrl });
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
}
