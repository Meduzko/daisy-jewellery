import { randomUUID } from 'crypto';

const NEW_ORDER_STATUS = 5;
const CHANNEL = 'Сайт';

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

export const getProductStoreId = (item) => item?.store_id || '';

const buildComment = (formData, cartItems) => {
  const parts = [];
  const {
    contact,
    payment,
    department,
    comments,
    isGift,
    giftFirstName,
    giftLastName,
    giftPhone,
    giftEmail
  } = formData;

  if (contact) {
    parts.push(`Спосіб зв'язку: ${contact}`);
  }

  if (payment) {
    parts.push(
      `Оплата: ${payment === 'liqPay' ? 'Банківська картка (LiqPay)' : 'Оплата при доставці'}`
    );
  }

  if (department) {
    parts.push(`Відділення Нової Пошти: ${department}`);
  }

  const sizedItems = cartItems.filter((item) => item?.size);
  if (sizedItems.length) {
    parts.push(
      `Розміри: ${sizedItems
        .map((item) => `${item.sku || item.title || item.product_id}: ${item.size}`)
        .join(', ')}`
    );
  }

  if (isGift) {
    const gift = [
      `${giftFirstName || ''} ${giftLastName || ''}`.trim(),
      giftPhone,
      giftEmail
    ]
      .filter(Boolean)
      .join(', ');

    if (gift) {
      parts.push(`Подарунок: ${gift}`);
    }
  }

  if (comments) {
    parts.push(comments);
  }

  return parts.join('\n');
};

export const buildDntradeOrderPayload = ({
  formData = {},
  cartItems = [],
  paidInfo = {}
}) => {
  const { firstName, lastName, email, phone, cityName, department, payment } = formData;
  const isCard = payment === 'liqPay' || Boolean(paidInfo?.order_id);

  const cart = cartItems
    .filter((item) => item?.product_id)
    .map((item) => {
      const { prices, ...itemWithoutPrices } = item;
      const row = {
        product_id: itemWithoutPrices.product_id,
        store_id: getProductStoreId(itemWithoutPrices),
        price: Number(itemWithoutPrices.price) || 0,
        quantity: Number(itemWithoutPrices.quantity) || 1,
        product_bonus_sum: 0
      };

      if (!row.store_id) {
        delete row.store_id;
      }

      return row;
    });

  const personal_info = {
    name: `${firstName || ''} ${lastName || ''}`.trim(),
    city: cityName || '',
    phone: String(phone || '').replace(/\D/g, ''),
    email: email || '',
    comment: buildComment(formData, cartItems),
    card_or_cash: isCard ? 1 : 0,
    bonus_sum: 0,
    writeoff_bonus: 0,
    delivery_title: 'Нова Пошта',
    delivery_price: 0
  };

  if (department) {
    personal_info.street = department;
  }

  return {
    id: randomUUID(),
    number: 0,
    date: formatDate(new Date()),
    status: NEW_ORDER_STATUS,
    channel: CHANNEL,
    reserve: 0,
    private_id:
      paidInfo?.order_id != null
        ? String(paidInfo.order_id)
        : String(Math.floor(100000 + Math.random() * 900000)),
    labels: isCard ? ['Сайт', 'LiqPay'] : ['Сайт'],
    cart,
    personal_info
  };
};

export const uploadOrderToDntrade = async (orderData) => {
  const ROOT_URI = process.env.API_ROOT_URI;
  const API_KEY = process.env.API_KEY;

  if (!ROOT_URI || !API_KEY) {
    const error = new Error('DNTrade API is not configured');
    error.status = 500;
    throw error;
  }

  const payload = buildDntradeOrderPayload(orderData);

  if (!payload.cart.length) {
    const error = new Error('Missing cart items with product_id');
    error.status = 400;
    throw error;
  }

  try {
    const response = await fetch(`${ROOT_URI}/orders/upload`, {
      method: 'POST',
      headers: {
        ApiKey: API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let result;

    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { error: text || 'Invalid response' };
    }

    if (!response.ok || result?.status !== 1) {
      const error = new Error(result?.error || result?.message || 'DNTrade order upload failed');
      error.status = response.ok ? 400 : response.status;
      error.body = result;
      throw error;
    }

    return result;
  } catch (error) {
    if (error.body || error.status) {
      throw error;
    }

    const networkError = new Error(error?.message || 'DNTrade order upload request failed');
    networkError.status = 502;
    throw networkError;
  }
};
