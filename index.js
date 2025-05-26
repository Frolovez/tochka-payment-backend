require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post('/api/payment-request', async (req, res) => {
  const { name, email, amount } = req.body;

  if (!amount || !email) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const response = await axios.post(
      process.env.TOCHKA_API_URL,
      {
        payee: {
          bankCode: process.env.TOCHKA_BANK_CODE,
          account: process.env.TOCHKA_ACCOUNT,
        },
        amount,
        qrType: 'QRDynamic',
        purpose: process.env.TOCHKA_PAYMENT_PURPOSE,
        mcc: process.env.TOCHKA_MCC,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TOCHKA_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const qrLink = response.data?.url || 'https://tochka.com/';

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Ссылка на оплату',
      html: `<p>Здравствуйте!</p><p>Оплатите по ссылке: <a href="${qrLink}">${qrLink}</a></p>`,
    });

    res.json({ success: true, qr: qrLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при генерации QR или отправке письма' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});