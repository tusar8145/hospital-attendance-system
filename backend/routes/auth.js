// routes/auth.js
import express from 'express';
import {
  forgotPassword,
  verifyOTP,
  resendOTP,
  resetPassword
} from '../controllers/AuthController.js';

const router = express.Router();

router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/verify-otp', verifyOTP);
router.post('/auth/resend-otp', resendOTP);
router.post('/auth/reset-password', resetPassword);

export default router;