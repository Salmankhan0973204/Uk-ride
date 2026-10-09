import { Router } from 'express';
import { detail, list } from './vehicle-types.controller.js';

export const vehicleTypesRouter = Router();

// Public: no sign-in needed. A visitor can see the cars before making an account.
vehicleTypesRouter.get('/', list);
vehicleTypesRouter.get('/:slug', detail);
