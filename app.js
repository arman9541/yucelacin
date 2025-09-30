import express from 'express';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

dotenv.config();

const app = express();
const upload = multer();

// --- Write service account JSON from environment variable ---
const serviceAccountPath = path.resolve('./service-account.json');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  console.error('Missing GOOGLE_APPLICATION_CREDENTIALS_JSON env variable');
  process.exit(1);
}

// Write JSON to temporary file (Render cannot read files directly)
fs.writeFileSync(serviceAccountPath, process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

// Set GOOGLE_APPLICATION_CREDENTIALS so the Google SDK can authenticate
process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountPath;

// --- Initialize reCAPTCHA Enterprise client ---
const recaptchaClient = new RecaptchaEnterpriseServiceClient();

// --- Middleware ---
app.use(cors({
  origin: 'https://www.yucelacin.com', // frontend domain
  methods: ['POST', 'GET', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- OPTIONS preflight for /verify-recaptcha ---
app.options('/verify-recaptcha', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://www.yucelacin.com');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

// --- Health check ---
app.get('/', (req, res) => res.send('Backend is running'));

// --- reCAPTCHA Enterprise verification route ---
app.post('/verify-recaptcha', upload.none(), async (req, res) => {
  const token = req.body['g-recaptcha-response'];
  const recaptchaAction = req.body.action || 'submit';

  if (!token) return res.json({ success: false, error: 'Missing reCAPTCHA token' });

  const projectID = process.env.RECAPTCHA_PROJECT_ID;
  const recaptchaKey = process.env.RECAPTCHA_SITE_KEY;

  if (!projectID || !recaptchaKey) {
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

    console.log('Assessment:', { valid, action, score, reasons: response.riskAnalysis?.reasons });

    if (!valid) return res.json({ success: false, error: response.tokenProperties.invalidReason || 'Invalid token' });
    if (action !== recaptchaAction) return res.json({ success: false, error: 'Action mismatch' });

    const threshold = 0.4;
    if (score >= threshold) {
      return res.json({ success: true, score, reasons: response.riskAnalysis?.reasons || [] });
    } else {
      return res.json({ success: false, score, error: 'Low reCAPTCHA score', reasons: response.riskAnalysis?.reasons || [] });
    }

  } catch (err) {
    console.error('Error verifying reCAPTCHA:', err);
    res.json({ success: false, error: 'Error verifying reCAPTCHA' });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
