import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, description, orderData } = body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
    }

    const orderId = Math.floor(100000 + Math.random() * 900000);

    const params = {
      public_key: process.env.LIQPAY_PUBLIC_KEY,
      version: '3',
      action: 'pay',
      amount: amount.toString(),
      currency: 'UAH',
      description: description || 'Payment Description',
      order_id: orderId,
      result_url: `${process.env.SITE_DOMAIN}/`,
      server_url: `${process.env.SITE_DOMAIN}/api/payment-callback`,
      info: JSON.stringify(orderData),
      paytypes: 'apay,gpay,card,privat24,invoice,qr',
    };

    const jsonString = JSON.stringify(params);
    const data = Buffer.from(jsonString).toString('base64');
    const concatString = process.env.LIQPAY_PRIVATE_KEY + data + process.env.LIQPAY_PRIVATE_KEY;
    const sha1Hash = crypto.createHash('sha1').update(concatString).digest();
    const signature = Buffer.from(sha1Hash).toString('base64');

    return NextResponse.json({ data, signature });
  } catch (error) {
    console.error('Error in create-payment route:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
