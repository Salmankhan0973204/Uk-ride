import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { getMe, updateMe } from './users.controller.js';
import { updateProfileSchema } from './users.schemas.js';

export const usersRouter = Router();

// Everything under /users needs a signed-in user.
usersRouter.use(requireAuth);

usersRouter.get('/me', getMe);
// PATCH, not PUT: the body holds only the fields to change.
usersRouter.patch('/me', validate(updateProfileSchema), updateMe);
