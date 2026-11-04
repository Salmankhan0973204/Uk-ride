import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/response.js';
import type { QuoteRequest } from './quotes.schemas.js';
import { quoteJourney } from './quotes.service.js';

/** Prices a journey. Public: a visitor can see prices before making an account. */
export const quote: RequestHandler = async (req, res) => {
  const result = await quoteJourney(req.body as QuoteRequest);

  // A quote is one customer's, and prices can change: no copy is kept anywhere.
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, {
    status: result.quoteId ? 201 : 200,
    message: result.quoteId ? 'Quote saved' : 'No prices are published yet',
    data: result,
  });
};
