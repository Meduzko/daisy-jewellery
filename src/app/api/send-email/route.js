import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

function generateOrderNumber() {
  return Math.floor(100000 + Math.random() * 900000);
}

export async function POST(request) {
  const body = await request.json();
  const { formData = {}, cartItems, totalPrice, paidInfo } = body;
  const {
    firstName,
    lastName,
    email,
    phone,
    contact,
    comments,
    cityName,
    department,
  } = formData;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    secure: true,
    port: 465,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  const itemsDetails = cartItems
    .map(
      (item, index) => `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px;"><img src="cid:product_image_${index}" alt="${item.title}" style="width: 50px; height: auto;" /></td>
          <td style="padding: 8px;">${item.code}</td>
          <td style="padding: 8px;">${item.sku}</td>
          <td style="padding: 8px;">${item.title}</td>
          <td style="padding: 8px;">${item.short_description}</td>
          <td style="padding: 8px;">${item.size || ''}</td>
          <td style="padding: 8px;">${item.price} грн</td>
        </tr>
      `
    )
    .join('');

  const orderNumber = generateOrderNumber();
  const paidText = paidInfo?.order_id
    ? `<strong>Ми отримали оплату, очікуйте доставку, номер замовлення - ${paidInfo.order_id} </strong>`
    : `Наш менеджер зв'яжеться з вами найближчим часом, щоб підтвердити деталі замовлення`;
  const mailTitle = paidInfo?.order_id
    ? `Замовлення #${paidInfo.order_id} успішно оплачено`
    : `Замовлення #${orderNumber} прийнято`;

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    cc: 'daisyjewellery.info@gmail.com',
    subject: mailTitle,
    html: `
      <h2>Шановний(-а) ${firstName} ${lastName}</h2>
      <p>Дякуємо за ваше замовлення в інтернет-магазині Daisy Jewellery!</p>
      <p>Деталі вашого замовлення:</p>
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th style="border-bottom: 1px solid #ddd; padding: 8px; text-align: left; background-color: #0000001a;"></th>
            <th style="border-bottom: 1px solid #ddd; padding: 8px; text-align: left; background-color: #0000001a;">Код</th>
            <th style="border-bottom: 1px solid #ddd; padding: 8px; text-align: left; background-color: #0000001a;">Артикул</th>
            <th style="border-bottom: 1px solid #ddd; padding: 8px; text-align: left; background-color: #0000001a;">Назва</th>
            <th style="border-bottom: 1px solid #ddd; padding: 8px; text-align: left; background-color: #0000001a;">Опис</th>
            <th style="border-bottom: 1px solid #ddd; padding: 8px; text-align: left; background-color: #0000001a;">Розмір</th>
            <th style="border-bottom: 1px solid #ddd; padding: 8px; text-align: left; background-color: #0000001a;">Ціна</th>
          </tr>
        </thead>
        <tbody>
          ${itemsDetails}
        </tbody>
      </table>
      <p>Загальна сума: <strong>${totalPrice}</strong> грн</p>
      <p>${paidText}</p>
      <ul>
        <li>Населений пункт: ${cityName}</li>
        <li>Відділення Нової Пошти: ${department}</li>
        <li>Спосіб зв'язку: ${contact}</li>
        <li>Email: ${email}</li>
        <li>Телефон: ${phone}</li>
        ${comments ? `<li>Коментар: ${comments}</li>` : ''}
      </ul>
      <p>З найкращими побажаннями,</p>
      <p>Команда Daisy Jewellery</p>
    `,
    attachments: cartItems.map((item, index) => ({
      filename: `${item.sku}${item.image_path}`,
      path: item.image_path,
      cid: `product_image_${index}`,
    })),
  };

  try {
    console.log('try to send email');
    const result = await transporter.sendMail(mailOptions);

    if (result.response?.includes('OK')) {
      return NextResponse.json({ message: 'Email sent successfully!' });
    }
    console.error('Failed to send email.');
    return NextResponse.json({ message: 'Failed to send email.' }, { status: 500 });
  } catch (e) {
    return NextResponse.json(
      { message: 'Too many requests, please try again later.' },
      { status: 429 }
    );
  }
}
