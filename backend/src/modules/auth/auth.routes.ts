import { Router } from 'express';
import {
  emailLimiter,
  loginBurstLimiter,
  loginLimiter,
  otpVerifyLimiter,
  resetLimiter,
  registerLimiter,
  sessionLimiter,
} from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import {
  checkEmail,
  choosePassword,
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  verifyResetCode,
} from './auth.controller.js';
import {
  checkEmailSchema,
  checkResetCodeSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.schemas.js';

export const authRouter = Router();

// The limiter comes first: a refused request should cost the server nothing.
authRouter.post('/check-email', registerLimiter, validate(checkEmailSchema), checkEmail);
authRouter.post('/register', registerLimiter, validate(registerSchema), register);
authRouter.post('/login', loginBurstLimiter, loginLimiter, validate(loginSchema), login);
// These two are authenticated by the refresh cookie, not by an access token:
// they are called exactly when the access token is missing or expired.
authRouter.post('/refresh', sessionLimiter, refresh);
authRouter.post('/logout', sessionLimiter, logout);
authRouter.get('/me', requireAuth, me);

// Forgot password: a code to the email, then a ticket, then the new password.
authRouter.post('/forgot-password', emailLimiter, validate(forgotPasswordSchema), forgotPassword);
authRouter.post(
  '/forgot-password/verify',
  otpVerifyLimiter,
  validate(checkResetCodeSchema),
  verifyResetCode,
);
authRouter.post('/reset-password', resetLimiter, validate(resetPasswordSchema), choosePassword);
