import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

// --- Middleware ---
app.use(cors({
  origin: "https://www.yucelacin.com",
  methods: ["POST", "GET", "OPTIONS"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Health check ---
app.get("/", (req, res) => res.send("Backend is running 🚀"));

// --- reCAPTCHA Standard verification route ---
app.post("/verify-recaptcha", async (req, res) => {
  const token = req.body["g-recaptcha-response"];
  if (!token) {
    return res.json({ success: false, error: "Missing reCAPTCHA token" });
  }

  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      { method: "POST" }
    );
    const data = await response.json();

    if (!data.success) {
      return res.json({ success: false, error: "Failed reCAPTCHA verification" });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error("Error verifying reCAPTCHA:", err);
    res.json({ success: false, error: "Verification failed" });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
