import { Router } from 'express';
import { requireStaffAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { config, read, replace } from './settings.controller.js';
import { settingsSchema } from './settings.schemas.js';

/** GET /config, for everyone. */
export const configRouter = Router();
configRouter.get('/', config);

/** /admin/settings, for admins. The settings screen arrives in step 11.6. */
export const adminSettingsRouter = Router();
adminSettingsRouter.use(requireStaffAuth, requireRole('ADMIN'));
adminSettingsRouter.get('/', read);
adminSettingsRouter.put('/', validate(settingsSchema), replace);
