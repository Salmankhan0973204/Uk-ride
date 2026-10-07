import type { RequestHandler, Response } from 'express';
import { verifyAccessToken } from '../modules/auth/auth.tokens.js';
import { AppError } from '../shared/AppError.js';

/**
 * Protects a route: the request must carry a valid access token in the
 * header `Authorization: Bearer <token>`. Put it in front of a controller:
 *
 *   router.get('/me', requireAuth, me);
 *
 * On success the user's id is stored in `res.locals.userId` for the
 * controller. On failure the request ends here with 401 and the controller
 * never runs.
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  // Tells a client how this route expects to be authenticated.
  res.set('WWW-Authenticate', 'Bearer');

  const [scheme, token, ...rest] = (req.get('authorization') ?? '').trim().split(/\s+/);

  if (!scheme) {
    throw AppError.unauthenticated('Sign in to continue');
  }
  if (scheme.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
    throw AppError.unauthenticated('The Authorization header must be "Bearer <token>"');
  }

  res.locals.userId = verifyAccessToken(token);
  res.removeHeader('WWW-Authenticate');
  next();
};

/** The id of the signed-in user. Only valid after requireAuth has run. */
export function currentUserId(res: Response): string {
  const userId: unknown = res.locals.userId;
  if (typeof userId !== 'string') {
    // A route used this without requireAuth in front of it: a bug, not a bad request.
    throw new Error('currentUserId() was called on a route without requireAuth');
  }
  return userId;
}
