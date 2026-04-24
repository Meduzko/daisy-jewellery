import crypto from 'crypto';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_AMOUNT = 1_000_000;
const MAX_DESCRIPTION_LEN = 2048;
/** Client sends totalPrice vs amount both from cart; allow tiny float noise. */
const AMOUNT_MATCH_EPSILON = 0.02;

function digitsOnly(phone) {
  return String(phone ?? '').replace(/\D/g, '');
}

function validateAmountAndDescription(amount, description, errors) {
  const numAmount = Number(amount);
  if (amount === '' || amount == null || Number.isNaN(numAmount) || numAmount <= 0) {
    errors.push('Invalid amount');
  } else if (numAmount > MAX_AMOUNT) {
    errors.push('Amount exceeds maximum');
  } else {
    const dec = String(amount).split('.')[1];
    if (dec && dec.length > 2) {
      errors.push('Amount must have at most 2 decimal places');
    }
  }

  if (description != null && String(description).length > MAX_DESCRIPTION_LEN) {
    errors.push('Description too long');
  }
}

function validateOrderPayload(body) {
  /** @type {string[]} */
  const errors = [];
  const { amount, description, orderData, email: topLevelEmail } = body || {};
  const numAmount = Number(amount);

  validateAmountAndDescription(amount, description, errors);

  /** Legacy: PaymentForm sends only amount, description, email (no orderData). */
  if (orderData == null) {
    if (!String(description || '').trim()) {
      errors.push('description is required');
    }
    const em = String(topLevelEmail || '').trim();
    if (!em) {
      errors.push('email is required');
    } else if (!EMAIL_RE.test(em)) {
      errors.push('Invalid email');
    }
    return errors;
  }

  if (typeof orderData !== 'object' || Array.isArray(orderData)) {
    errors.push('Invalid orderData');
    return errors;
  }

  const { formData, cartItems, totalPrice } = orderData;

  if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
    errors.push('Invalid formData');
    return errors;
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    cityName,
    department,
    contact,
    payment,
  } = formData;

  if (!String(firstName || '').trim()) errors.push('firstName is required');
  if (!String(lastName || '').trim()) errors.push('lastName is required');
  if (!String(email || '').trim()) {
    errors.push('email is required');
  } else if (!EMAIL_RE.test(String(email).trim())) {
    errors.push('Invalid email');
  }

  const rawPhone = digitsOnly(phone);
  if (!rawPhone) {
    errors.push('phone is required');
  } else if (!/^[0-9]{12}$/.test(rawPhone)) {
    errors.push('phone must be 12 digits (e.g. 380…)');
  }

  if (!String(cityName || '').trim()) errors.push('cityName is required');
  if (!String(department || '').trim()) errors.push('department is required');
  if (!String(contact || '').trim()) errors.push('contact is required');
  if (!String(payment || '').trim()) {
    errors.push('payment is required');
  } else if (String(payment) !== 'liqPay') {
    errors.push('Invalid payment method for this checkout');
  }

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    errors.push('cartItems must be a non-empty array');
  } else {
    cartItems.forEach((item, i) => {
      if (!item || typeof item !== 'object') {
        errors.push(`cartItems[${i}] is invalid`);
        return;
      }
      const price = Number(item.price);
      if (Number.isNaN(price) || price <= 0) {
        errors.push(`cartItems[${i}].price is invalid`);
      }
      if (!item.code && !item.sku) {
        errors.push(`cartItems[${i}] must have code or sku`);
      }
    });
  }

  const clientTotal = Number(totalPrice);
  if (errors.length) return errors;
  if (Number.isNaN(clientTotal) || clientTotal <= 0) {
    errors.push('totalPrice is invalid');
    return errors;
  }
  if (Math.abs(clientTotal - numAmount) > AMOUNT_MATCH_EPSILON) {
    errors.push('Amount does not match order total');
  }

  return errors;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const validationErrors = validateOrderPayload(req.body);
    if (validationErrors.length) {
      return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    const { amount, description, orderData } = req.body;

    const publicKey = process.env.LIQPAY_PUBLIC_KEY || '';
    const privateKey = process.env.LIQPAY_PRIVATE_KEY || '';
    if (!publicKey || !privateKey) {
      console.error('[create-payment] Missing LIQPAY_PUBLIC_KEY or LIQPAY_PRIVATE_KEY');
      return res.status(500).json({ message: 'Payment configuration error' });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    if (!baseUrl) {
      console.error('[create-payment] Missing NEXT_PUBLIC_BASE_URL');
      return res.status(500).json({ message: 'Payment configuration error' });
    }

    const useSandbox =
      process.env.LIQPAY_SANDBOX === '1' || publicKey.startsWith('sandbox_');

    if (process.env.LIQPAY_SANDBOX === '1' && publicKey && !publicKey.startsWith('sandbox_')) {
      console.warn(
        '[create-payment] LIQPAY_SANDBOX=1 but LIQPAY_PUBLIC_KEY is not sandbox_* — LiqPay may block or rate-limit. Use the test key pair from the LiqPay cabinet (API tab).'
      );
    }

    const orderId = Math.floor(100000 + Math.random() * 900000);

    const infoPayload =
      orderData != null
        ? orderData
        : { email: String(req.body.email || '').trim(), source: 'payment-form' };

    const params = {
      public_key: publicKey,
      version: '3',
      action: 'pay',
      amount: String(amount),
      currency: 'UAH',
      description: String(description || 'Payment Description').slice(0, MAX_DESCRIPTION_LEN),
      order_id: orderId,
      result_url: `${baseUrl.replace(/\/$/, '')}/`,
      server_url: `${baseUrl.replace(/\/$/, '')}/api/payment-callback`,
      info: JSON.stringify(infoPayload),
      paytypes: 'apay,gpay,card,privat24,invoice,qr',
      ...(useSandbox ? { sandbox: '1' } : {}),
    };

    const jsonString = JSON.stringify(params);
    const data = Buffer.from(jsonString).toString('base64');
    const concatString = privateKey + data + privateKey;
    const sha1Hash = crypto.createHash('sha1').update(concatString).digest();
    const signature = Buffer.from(sha1Hash).toString('base64');

    res.status(200).json({ data, signature });
  } catch (error) {
    console.error('Error in create-payment route:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
