// app.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// reCAPTCHA config endpoint
app.get('/config', (req, res) => {
  res.json({
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY
  });
});

// Nodemailer transporter for Zoho Mail
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: parseInt(process.env.SMTP_PORT, 10) === 465, // SSL for 465, TLS for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // must be Zoho App Password
  },
});

// Verify SMTP connection at startup
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection failed:', error);
  } else {
    console.log('SMTP server is ready to send messages');
  }
});

// Contact form endpoint
app.post('/contact', async (req, res) => {
  try {
    const captchaResponse = req.body['g-recaptcha-response'];
    if (!captchaResponse) {
      return res.json({ success: false, message: 'Captcha missing' });
    }

    // Verify reCAPTCHA with Google
    const params = new URLSearchParams({
      secret: process.env.RECAPTCHA_SECRET_KEY,
      response: captchaResponse,
      remoteip: req.ip,
    });

    const googleRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: params,
    });

    const data = await googleRes.json();
    if (!data.success) {
      return res.json({ success: false, message: 'Captcha verification failed' });
    }

    // Extract and sanitize form data
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim();
    const phone = (req.body.phone || '').trim();
    const message = (req.body.message || '').trim();

    // Send email via Zoho SMTP
    const mailOptions = {
      from: `"Website Contact" <${process.env.SMTP_USER}>`,
      to: process.env.MAIL_TO,
      subject: `New message from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Phone: ${phone}
Message:
${message}
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: 'Message sent successfully!' });

  } catch (err) {
    console.error('Error in /contact:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
