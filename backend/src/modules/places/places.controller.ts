import type { RequestHandler } from 'express';
import { validQuery } from '../../middleware/validate.js';
import { sendSuccess } from '../../shared/response.js';
import type { PlaceSearch } from './places.schemas.js';
import { suggestPlaces } from './places.service.js';

/**
 * Suggestions for an address box. Public: a visitor fills in a journey
 * before they have an account.
 */
export const search: RequestHandler = async (_req, res) => {
  const { q } = validQuery<PlaceSearch>(res);
  const places = await suggestPlaces(q);

  // The same text gives the same suggestions for everyone, so the browser may
  // keep them for a few minutes: going back over a word costs no new request.
  res.set('Cache-Control', 'public, max-age=300');
  sendSuccess(res, {
    message: places.length > 0 ? 'Places' : 'Nothing found',
    data: { places },
  });
};
