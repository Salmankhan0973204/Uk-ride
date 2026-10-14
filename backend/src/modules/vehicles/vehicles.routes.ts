import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import { create, getOne, list, update } from './vehicles.controller.js';
import { createVehicleSchema, listVehiclesQuery, updateVehicleSchema } from './vehicles.schemas.js';

export const adminVehiclesRouter = Router();

// The fleet is managed by admins only.
adminVehiclesRouter.use(requireAuth, requireRole('ADMIN'));

adminVehiclesRouter.get('/', validateQuery(listVehiclesQuery), list);
adminVehiclesRouter.post('/', validate(createVehicleSchema), create);
adminVehiclesRouter.get('/:id', getOne);
adminVehiclesRouter.patch('/:id', validate(updateVehicleSchema), update);
// There is no DELETE. A car leaves the fleet by being retired (step 4.6), so
// the bookings it drove can still say which car it was.
