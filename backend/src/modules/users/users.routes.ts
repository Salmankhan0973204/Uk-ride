import { Router } from 'express';
import { passwordLimiter } from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { changeMyPassword, getMe, updateMe } from './users.controller.js';
import { changePasswordSchema, updateProfileSchema } from './users.schemas.js';

export const usersRouter = Router();

// Everything under /users needs a signed-in user.
usersRouter.use(requireAuth);

usersRouter.get('/me', getMe);
// PATCH, not PUT: the body holds only the fields to change.
usersRouter.patch('/me', validate(updateProfileSchema), updateMe);
// POST, not PATCH: this is an action with consequences (other devices are
// signed out), not a field being edited.
usersRouter.post('/me/password', passwordLimiter, validate(changePasswordSchema), changeMyPassword);
