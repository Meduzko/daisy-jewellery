import nodemailer from 'nodemailer';
// import { RateLimiterRedis } from 'rate-limiter-flexible';
// import Redis from 'ioredis';

// const redisClient = new Redis({
//   host: 'localhost', // Update with your Redis host
//   port: 6379,        // Update with your Redis port if needed
// });

// // Set up rate limiter
// const rateLimiter = new RateLimiterRedis({
//   storeClient: redisClient,
//   keyPrefix: 'rateLimiter',
//   points: 5,          // Maximum of 5 requests
//   duration: 60 * 15,  // Per 15 minutes per IP address
// });

export default async function handler(req, res) {
  if (req.method === 'POST') {
    console.log('send-email begin formData', formData);
    console.log('send-email begin cartItems', cartItems);
    console.log('send-email begin paidInfo', paidInfo);
    const { formData = {}, cartItems, totalPrice, paidInfo } = req.body;
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

    // Set up the Nodemailer transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      // service: 'gmail',
      host: 'smtp.gmail.com',
      secure: true,
      port: 465,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
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

    const paidText = paidInfo?.order_id ? `<strong>Ми отримали оплату, очікуйте доставку, номер замовлення - ${paidInfo.order_id} </strong>` : `Наш менеджер зв'яжеться з вами найближчим часом, щоб підтвердити деталі замовлення`;
    const mailTitle = paidInfo?.order_id ? 'Замовлення успішно оплачено' : 'Замовлення прийнято';

    const mailOptions = {
      from: process.env.GMAIL_USER, // sender address
      to: email, // recipient address (send to yourself)
      cc: 'daisyjewellery.info@gmail.com',
      subject: mailTitle, // Subject line
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
      filename: `${item.sku}${item.image_path}`, // Adjust the extension as necessary
      path: item.image_path, // Use the actual path to your image
      cid: `product_image_${index}`, // Must match the `cid` in the HTML
    })),
    };

    try {
      console.log('try to send email');
      // Consume a point from the rate limiter
      // await rateLimiter.consume(req.headers['x-real-ip'] || req.connection.remoteAddress);
      const result = await transporter.sendMail(mailOptions);

      if (result.response?.includes('OK')) {
        return res.status(200).json({ message: 'Email sent successfully!' });
      } else {
        console.error('Failed to send email.')
        return res.status(500).json({ message: 'Failed to send email.' });
      }
    } catch (rateLimiterRes) {
      // Rate limiter triggered
      return res.status(429).json({ message: 'Too many requests, please try again later.' });
    }
  } else {
    console.error('Method Not Allowed');
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
