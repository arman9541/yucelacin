import express from 'express';
import fetch from 'node-fetch'; // or native fetch in Node 18+
import multer from 'multer'; // parse multipart/form-data
import cors from 'cors';

const app = express();
const upload = multer(); // for parsing multipart/form-data

// Enable CORS from your frontend domain
app.use(cors({
  origin: 'https://www.yucelacin.com', // frontend domain
  methods: ['POST']
}));

// If you still want JSON/urlencoded support for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// reCAPTCHA verification route
app.post('/verify-recaptcha', upload.none(), async (req, res) => {
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
