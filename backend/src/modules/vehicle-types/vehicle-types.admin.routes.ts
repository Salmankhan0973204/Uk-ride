import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { listAll } from './vehicle-types.admin.controller.js';

export const adminVehicleTypesRouter = Router();

// Signed in first, then the right role. The order matters: requireRole reads
// the user that requireAuth found.
adminVehicleTypesRouter.use(requireAuth, requireRole('ADMIN'));

adminVehicleTypesRouter.get('/', listAll);
