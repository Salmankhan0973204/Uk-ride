import { Router } from 'express';
import { placesLimiter } from '../../middleware/rateLimit.js';
import { validateQuery } from '../../middleware/validate.js';
import { search } from './places.controller.js';
import { placeSearchSchema } from './places.schemas.js';

export const placesRouter = Router();

// GET with the text in the address: asking changes nothing, and the answer can be cached.
placesRouter.get('/', placesLimiter, validateQuery(placeSearchSchema), search);
