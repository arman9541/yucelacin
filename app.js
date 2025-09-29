import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch'; // or native fetch if Node 18+

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

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
