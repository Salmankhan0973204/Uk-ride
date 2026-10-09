import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { getMe } from './users.controller.js';

export const usersRouter = Router();

// Everything under /users needs a signed-in user.
usersRouter.use(requireAuth);

usersRouter.get('/me', getMe);
