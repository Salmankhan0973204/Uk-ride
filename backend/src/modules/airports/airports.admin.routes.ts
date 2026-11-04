import { Router } from 'express';
import { requireStaffAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { create, listAll, update } from './airports.admin.controller.js';
import { createAirportSchema, updateAirportSchema } from './airports.schemas.js';

export const adminAirportsRouter = Router();

adminAirportsRouter.use(requireStaffAuth, requireRole('ADMIN'));

adminAirportsRouter.get('/', listAll);
adminAirportsRouter.post('/', validate(createAirportSchema), create);
// No DELETE: PATCH { "isActive": false } switches an airport off, and bookings keep it.
adminAirportsRouter.patch('/:id', validate(updateAirportSchema), update);
