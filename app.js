// app.js
import express from 'express';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer(); // For parsing multipart/form-data from frontend

// Initialize reCAPTCHA Enterprise client
const recaptchaClient = new RecaptchaEnterpriseServiceClient();

// Middleware
app.use(cors({
  origin: 'https://www.yucelacin.com', // Allow frontend
  methods: ['POST']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => res.send('Backend is running'));

// reCAPTCHA Enterprise verification route
app.post('/verify-recaptcha', upload.none(), async (req, res) => {
  const token = req.body['g-recaptcha-response'];
  const recaptchaAction = req.body.action || 'submit';

  console.log('Received token:', token);
  console.log('Expected action:', recaptchaAction);

  if (!token) return res.json({ success: false, error: 'Missing reCAPTCHA token' });

  const projectID = process.env.RECAPTCHA_PROJECT_ID;
  const recaptchaKey = process.env.RECAPTCHA_SITE_KEY;

  if (!projectID || !recaptchaKey) {
    console.error('Missing reCAPTCHA environment variables');
    return res.json({ success: false, error: 'Server configuration error' });
  }

  try {
    const projectName = `projects/${projectID}`;

    const request = {
      parent: projectName,
      assessment: {
        event: {
          token,
          siteKey: recaptchaKey,
          expectedAction: recaptchaAction,
          userAgent: req.get('User-Agent'),
          userIpAddress: req.ip
        }
      }
    };

    const [response] = await recaptchaClient.createAssessment(request);

    const valid = response.tokenProperties?.valid;
    const action = response.tokenProperties?.action;
    const score = response.riskAnalysis?.score ?? 0;

    console.log('Assessment result:', { valid, action, score, reasons: response.riskAnalysis?.reasons });

    if (!valid) {
      const reason = response.tokenProperties?.invalidReason || 'Invalid token';
      console.log('Invalid token reason:', reason);
      return res.json({ success: false, error: `Invalid token: ${reason}` });
    }

    if (action !== recaptchaAction) {
      console.log(`Action mismatch: expected ${recaptchaAction}, got ${action}`);
      return res.json({ success: false, error: 'Action mismatch' });
    }

    const threshold = 0.4; // Adjust threshold as needed
    if (score >= threshold) {
      return res.json({ success: true, score, reasons: response.riskAnalysis?.reasons || [] });
    } else {
      return res.json({ success: false, score, error: 'Low reCAPTCHA score', reasons: response.riskAnalysis?.reasons || [] });
    }

  } catch (err) {
    console.error('Error verifying reCAPTCHA:', err);
    return res.json({ success: false, error: 'Error verifying reCAPTCHA' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
