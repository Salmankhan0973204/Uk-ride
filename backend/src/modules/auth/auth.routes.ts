import { Router } from 'express';
import {
  emailLimiter,
  linkLimiter,
  loginLimiter,
  registerLimiter,
  sessionLimiter,
} from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import {
  choosePassword,
  confirmEmail,
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resendConfirmation,
} from './auth.controller.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schemas.js';

export const authRouter = Router();

// The limiter comes first: a refused request should cost the server nothing.
authRouter.post('/register', registerLimiter, validate(registerSchema), register);
authRouter.post('/login', loginLimiter, validate(loginSchema), login);
// These two are authenticated by the refresh cookie, not by an access token:
// they are called exactly when the access token is missing or expired.
authRouter.post('/refresh', sessionLimiter, refresh);
authRouter.post('/logout', sessionLimiter, logout);
authRouter.get('/me', requireAuth, me);

// Links sent by email. Opening one needs no sign-in: the token is the proof.
authRouter.post('/verify-email', linkLimiter, validate(verifyEmailSchema), confirmEmail);
authRouter.post('/resend-verification', emailLimiter, requireAuth, resendConfirmation);
authRouter.post('/forgot-password', emailLimiter, validate(forgotPasswordSchema), forgotPassword);
authRouter.post('/reset-password', linkLimiter, validate(resetPasswordSchema), choosePassword);
