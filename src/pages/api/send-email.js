import nodemailer from 'nodemailer';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';

const redisClient = new Redis({
  host: 'localhost', // Update with your Redis host
  port: 6379,        // Update with your Redis port if needed
});

// Set up rate limiter
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rateLimiter',
  points: 5,          // Maximum of 5 requests
  duration: 60 * 15,  // Per 15 minutes per IP address
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { formData = {}, cartItems } = req.body;
    const {
      firstName,
      lastName,
      email,
      phone,
      cityName,
      department,
    } = formData;

    console.log('send-email cartItems', cartItems);
    const totalPrice = cartItems.reduce((total, item) => total + item.price, 0);

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

    const mailText = '';

    const itemsDetails = cartItems
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px;">${item.title}</td>
          <td style="padding: 8px;">$${item.price.toFixed(2)}</td>
        </tr>
      `
    )
    .join('');

    const mailOptions = {
      from: process.env.GMAIL_USER, // sender address
      to: email, // recipient address (send to yourself)
      subject: 'Замовлення прийнято', // Subject line
      html: `
      <p>Дякуємо за замовлення!</p>
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th style="border-bottom: 1px solid #ddd; padding: 8px; text-align: left;">Назва</th>
            <th style="border-bottom: 1px solid #ddd; padding: 8px; text-align: left;">Ціна</th>
          </tr>
        </thead>
        <tbody>
          ${itemsDetails}
        </tbody>
      </table>
      <p>Загальна вартість: <strong>$${totalPrice.toFixed(2)}</strong></p>
      <p>Ваше замовлення прийнято і буде взято в обробку найближчим часом!</p>
      <p>Наш менеджер звяжеться з вами</p>
      <ul>
        <li>Email: ${email}</li>
        <li>Phone: ${phone}</li>
      </ul>
      <p>З повагою,</p>
      <p>Daisy Jewellery</p>
    `,
    };

    try {
      // Consume a point from the rate limiter
      await rateLimiter.consume(req.headers['x-real-ip'] || req.connection.remoteAddress);

      // Your existing logic to handle the email sending
      const result = await transporter.sendMail(mailOptions); // This represents your email sending function

      console.log('result', result);
      
      if (result.response?.includes('OK')) {
        return res.status(200).json({ message: 'Email sent successfully!' });
      } else {
        return res.status(500).json({ message: 'Failed to send email.' });
      }
    } catch (rateLimiterRes) {
      // Rate limiter triggered
      return res.status(429).json({ message: 'Too many requests, please try again later.' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
