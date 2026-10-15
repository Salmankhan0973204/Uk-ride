import { Router } from 'express';
import { quoteLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { quote } from './quotes.controller.js';
import { quoteRequestSchema } from './quotes.schemas.js';

export const quotesRouter = Router();

// POST, although nothing is created: the question has a body, and a quote is
// worked out fresh each time rather than fetched.
quotesRouter.post('/', quoteLimiter, validate(quoteRequestSchema), quote);
