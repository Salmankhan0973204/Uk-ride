import { Router } from 'express';
import { quoteLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { quote } from './quotes.controller.js';
import { quoteRequestSchema } from './quotes.schemas.js';

export const quotesRouter = Router();

// POST: each question creates a quote, saved for a short while so it can be booked.
quotesRouter.post('/', quoteLimiter, validate(quoteRequestSchema), quote);
