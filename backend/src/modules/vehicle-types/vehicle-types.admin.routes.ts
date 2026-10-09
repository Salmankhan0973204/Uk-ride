import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { create, deactivate, listAll, update } from './vehicle-types.admin.controller.js';
import { createVehicleTypeSchema, updateVehicleTypeSchema } from './vehicle-types.schemas.js';

export const adminVehicleTypesRouter = Router();

// Signed in first, then the right role. The order matters: requireRole reads
// the user that requireAuth found.
adminVehicleTypesRouter.use(requireAuth, requireRole('ADMIN'));

adminVehicleTypesRouter.get('/', listAll);
adminVehicleTypesRouter.post('/', validate(createVehicleTypeSchema), create);
adminVehicleTypesRouter.patch('/:id', validate(updateVehicleTypeSchema), update);
// DELETE switches the type off; it does not remove the row. PATCH with
// { "isActive": true } switches it back on.
adminVehicleTypesRouter.delete('/:id', deactivate);
