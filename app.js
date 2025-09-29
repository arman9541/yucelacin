import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch'; // or native fetch

import cors from 'cors'; // <-- install with npm i cors

const app = express();

// Allow requests from your frontend domain
app.use(cors({
  origin: 'https://www.yucelacin.com', // your frontend domain
  methods: ['POST']
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/verify-recaptcha', async (req, res) => {
  const token = req.body['g-recaptcha-response'];
  if (!token) return res.json({ success: false });

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

  try {
    const captchaRes = await fetch(verifyURL, { method: 'POST' });
    const captchaData = await captchaRes.json();
    res.json({ success: captchaData.success });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Server running'));
