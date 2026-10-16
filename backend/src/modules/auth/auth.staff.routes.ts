import { Router } from 'express';
import { loginLimiter, sessionLimiter } from '../../middleware/rateLimit.js';
import { requireStaffAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { loginSchema } from './auth.schemas.js';
import {
  STAFF_ROLES,
  staffLogin,
  staffLogout,
  staffMe,
  staffRefresh,
} from './auth.staff.controller.js';

/**
 * Sign-in for the admin panel, mounted at /api/v1/admin/auth. The staff
 * refresh cookie is sent to this path only.
 */
export const staffAuthRouter = Router();

staffAuthRouter.post('/login', loginLimiter, validate(loginSchema), staffLogin);
staffAuthRouter.post('/refresh', sessionLimiter, staffRefresh);
staffAuthRouter.post('/logout', sessionLimiter, staffLogout);
// A staff member who is demoted is refused here at once, token or not.
staffAuthRouter.get('/me', requireStaffAuth, requireRole(...STAFF_ROLES), staffMe);
