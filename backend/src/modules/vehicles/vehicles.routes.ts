import { Router } from 'express';
import { requireStaffAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import { changeStatus, create, getOne, list, update } from './vehicles.controller.js';
import {
  changeStatusSchema,
  createVehicleSchema,
  listVehiclesQuery,
  updateVehicleSchema,
} from './vehicles.schemas.js';

export const adminVehiclesRouter = Router();

// The fleet is managed by admins only.
adminVehiclesRouter.use(requireStaffAuth, requireRole('ADMIN'));

adminVehiclesRouter.get('/', validateQuery(listVehiclesQuery), list);
adminVehiclesRouter.post('/', validate(createVehicleSchema), create);
adminVehiclesRouter.get('/:id', getOne);
adminVehiclesRouter.patch('/:id', validate(updateVehicleSchema), update);
adminVehiclesRouter.patch('/:id/status', validate(changeStatusSchema), changeStatus);
// There is no DELETE. A car leaves the fleet by being retired (status RETIRED), so
// the bookings it drove can still say which car it was.
