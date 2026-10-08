import { Router } from 'express';
import { loginLimiter, registerLimiter, sessionLimiter } from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { login, logout, me, refresh, register } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

export const authRouter = Router();

// The limiter comes first: a refused request should cost the server nothing.
authRouter.post('/register', registerLimiter, validate(registerSchema), register);
authRouter.post('/login', loginLimiter, validate(loginSchema), login);
// These two are authenticated by the refresh cookie, not by an access token:
// they are called exactly when the access token is missing or expired.
authRouter.post('/refresh', sessionLimiter, refresh);
authRouter.post('/logout', sessionLimiter, logout);
authRouter.get('/me', requireAuth, me);
