import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/response.js';
import type { QuoteRequest } from './quotes.schemas.js';
import { quoteJourney } from './quotes.service.js';

/** Prices a journey. Public: a visitor can see prices before making an account. */
export const quote: RequestHandler = async (req, res) => {
  const result = await quoteJourney(req.body as QuoteRequest);

  // Prices can change at any time, so no copy is kept.
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, {
    message: result.quotes.length > 0 ? 'Quotes' : 'No prices are published yet',
    data: result,
  });
};
