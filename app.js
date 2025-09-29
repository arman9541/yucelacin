import express from 'express';
import fetch from 'node-fetch'; // or native fetch in Node 18+
import multer from 'multer'; // parse multipart/form-data
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env

const app = express();
const upload = multer(); // for parsing multipart/form-data

// Enable CORS from your frontend domain
app.use(cors({
  origin: 'https://www.yucelacin.com', // frontend domain
  methods: ['POST']
}));

// Optional: support JSON / urlencoded for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req, res) => res.send('Backend is running'));

// reCAPTCHA verification route
app.post('/verify-recaptcha', upload.none(), async (req, res) => {
  const token = req.body['g-recaptcha-response'];
  if (!token) return res.json({ success: false });

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // Use URLSearchParams for form-urlencoded request
  const params = new URLSearchParams();
  params.append('secret', secretKey);
  params.append('response', token);

  try {
    const captchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const captchaData = await captchaRes.json();

    console.log('Token received:', token);
    console.log('Google response:', captchaData);

    res.json({ success: captchaData.success });
  } catch (err) {
    console.error('Error verifying reCAPTCHA:', err);
    res.json({ success: false });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

