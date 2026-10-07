import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { login, me, register } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), register);
authRouter.post('/login', validate(loginSchema), login);
authRouter.get('/me', requireAuth, me);
