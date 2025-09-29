import express from 'express';
import {RecaptchaEnterpriseServiceClient} from '@google-cloud/recaptcha-enterprise';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer();

// Initialize reCAPTCHA Enterprise client
const recaptchaClient = new RecaptchaEnterpriseServiceClient();

app.use(cors({
  origin: 'https://www.yucelacin.com',
  methods: ['POST']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req, res) => res.send('Backend is running'));

// reCAPTCHA Enterprise verification route
app.post('/verify-recaptcha', upload.none(), async (req, res) => {
  const token = req.body['g-recaptcha-response'];
  const recaptchaAction = req.body.action || 'submit'; // Default action if not specified
  
  if (!token) {
    return res.json({ 
      success: false, 
      error: 'Missing reCAPTCHA token' 
    });
  }

  const projectID = process.env.RECAPTCHA_PROJECT_ID;
  const recaptchaKey = process.env.RECAPTCHA_SITE_KEY;

  if (!projectID || !recaptchaKey) {
    console.error('Missing reCAPTCHA environment variables');
    return res.json({ 
      success: false, 
      error: 'Server configuration error' 
    });
  }

  try {
    // Build the assessment request with user context
    const projectPath = recaptchaClient.projectPath(projectID);
    
    const request = {
      assessment: {
        event: {
          token: token,
          siteKey: recaptchaKey,
          userAgent: req.get('User-Agent'),
          userIpAddress: req.ip || req.connection.remoteAddress,
          expectedAction: recaptchaAction
        },
      },
      parent: projectPath,
    };

    const [response] = await recaptchaClient.createAssessment(request);

    console.log('Assessment response:', {
      valid: response.tokenProperties?.valid,
      action: response.tokenProperties?.action,
      score: response.riskAnalysis?.score,
      reasons: response.riskAnalysis?.reasons
    });

    // Check if the token is valid
    if (!response.tokenProperties?.valid) {
      const reason = response.tokenProperties?.invalidReason || 'unknown';
      console.log(`Invalid token: ${reason}`);
      return res.json({ 
        success: false, 
        error: `Invalid reCAPTCHA token: ${reason}` 
      });
    }

    // Check if the expected action was executed
    if (response.tokenProperties.action !== recaptchaAction) {
      console.log(`Action mismatch: expected ${recaptchaAction}, got ${response.tokenProperties.action}`);
      return res.json({ 
        success: false, 
        error: 'Action mismatch' 
      });
    }

    // Get the risk score and make decision
    const score = response.riskAnalysis?.score || 0;
    console.log(`reCAPTCHA score: ${score}`);

    // Use a threshold to determine success (adjust as needed)
    const scoreThreshold = 0.4;
    
    if (score >= scoreThreshold) {
      res.json({ 
        success: true, 
        score: score,
        reasons: response.riskAnalysis?.reasons || []
      });
    } else {
      res.json({ 
        success: false, 
        score: score,
        error: 'Low reCAPTCHA score',
        reasons: response.riskAnalysis?.reasons || []
      });
    }

  } catch (err) {
    console.error('Error verifying reCAPTCHA:', err);
    res.json({ 
      success: false, 
      error: 'Error verifying reCAPTCHA' 
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));