import type { RequestHandler } from 'express';
import { currentUserId } from '../../middleware/requireAuth.js';
import { sendSuccess } from '../../shared/response.js';
import { getProfile } from './users.service.js';

/**
 * Every handler here acts on "me": the user named by the access token. There
 * is no user id in the address, so nobody can ask for someone else's profile.
 */

/** The signed-in user's profile. */
export const getMe: RequestHandler = async (_req, res) => {
  const user = await getProfile(currentUserId(res));

  // Personal data for one user: no shared cache may keep it.
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, { message: 'Your profile', data: { user } });
};
