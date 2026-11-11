import { Router } from 'express';
import { bookingLimiter } from '../../middleware/rateLimit.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { book } from './bookings.controller.js';
import { bookingSchema } from './bookings.schemas.js';

export const bookingsRouter = Router();

// POST: each request books a quote. The limiter comes first: a refused
// request costs the server nothing.
bookingsRouter.post('/', bookingLimiter, requireAuth, validate(bookingSchema), book);
