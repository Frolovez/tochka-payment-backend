require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post('/api/payment-request', async (req, res) => {
  const { name, email, amount } = req.body;
  if (!amount || !email) return res.status(400).json({ error: 'Missing fields' });

  try {
    const response = await axios.post(
      process.env.TOCHKA_API_URL,
      {
        amount,
        purpose: ����� �� ${name || '������'} �� �㬬� ${amount}?,
      },
      {
        headers: {
          Authorization: Bearer ${process.env.TOCHKA_API_TOKEN},
          'Content-Type': 'application/json',
        },
      }
    );

    const qrLink = response.data?.url || 'https://bank.tochka.com/';

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: '��뫪� �� ������',
      html: <p>��ࠢ����!</p><p>������ �� ��뫪�: <a href="${qrLink}">${qrLink}</a></p>,
    });

    res.json({ success: true, qr: qrLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '�訡�� �� �����樨 QR ��� ��ࠢ�� ���쬠' });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('��ࢥ� ����饭');
});
