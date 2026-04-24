import { NextResponse } from 'next/server';

const formatDate = (date) => {
  const pad = (number) => (number < 10 ? '0' + number : number);

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const getOrderData = (orderData, orderID) => {
  const { formData, cartItems, totalPrice } = orderData;
  const { email, firstName, lastName, cityName, department } = formData;
  const orderDate = formatDate(new Date());

  const items = cartItems.map(({ product_id, pices, price }) => ({
    product_id,
    store_id: pices[0].store_id,
    price,
    quantity: 1,
  }));

  return {
    id: orderID,
    number: 0,
    date: orderDate,
    status: 0,
    channel: 'string',
    cart: items,
    personal_info: {
      client_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      name: firstName,
      street: 'string',
      building: 'string',
      city: cityName,
      phone: 'string',
      comment: 'string',
      card_or_cash: 0,
    },
  };
};

export async function POST(request) {
  try {
    const { orderData, orderID } = await request.json();
    if (!orderData || !orderID) {
      return NextResponse.json({ error: 'Missing orderData or orderID' }, { status: 400 });
    }

    const ROOT_URI = process.env.API_ROOT_URI;
    const API_KEY = process.env.API_KEY;
    const url = `${ROOT_URI}/orders/upload`;

    const data = getOrderData(orderData, orderID);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ApiKey: API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      return NextResponse.json(errorResponse, { status: response.status });
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
