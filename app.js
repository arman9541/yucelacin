// app.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Add this endpoint to provide reCAPTCHA site key
app.get('/config', (req, res) => {
  res.json({
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY // Make sure this is in your .env file
  });
});

// Contact form endpoint
app.post('/contact', async (req, res) => {
  try {
    const captchaResponse = req.body['g-recaptcha-response'];

    if (!captchaResponse) {
      return res.json({ captchaSuccess: false, message: 'Captcha missing' });
    }

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

    if (data.success) {
      console.log('Form data:', req.body);
      return res.json({ captchaSuccess: true });
    } else {
      return res.json({ captchaSuccess: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ captchaSuccess: false, message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});