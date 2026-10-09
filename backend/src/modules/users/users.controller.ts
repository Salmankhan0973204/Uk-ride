import type { RequestHandler } from 'express';
import { currentSessionId, currentUserId } from '../../middleware/requireAuth.js';
import { sendSuccess } from '../../shared/response.js';
import type { ChangePasswordInput, UpdateProfileInput } from './users.schemas.js';
import { changePassword, getProfile, updateProfile } from './users.service.js';

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

/** Changes the profile. The body was checked by the validate middleware. */
export const updateMe: RequestHandler = async (req, res) => {
  const user = await updateProfile(currentUserId(res), req.body as UpdateProfileInput);

  res.set('Cache-Control', 'no-store');
  sendSuccess(res, { message: 'Profile updated', data: { user } });
};

/** Changes the password. Other devices are signed out; this one stays signed in. */
export const changeMyPassword: RequestHandler = async (req, res) => {
  await changePassword(currentUserId(res), currentSessionId(res), req.body as ChangePasswordInput);

  res.set('Cache-Control', 'no-store');
  sendSuccess(res, {
    message: 'Password changed. Other devices have been signed out',
    data: null,
  });
};
