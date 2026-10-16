import type { RequestHandler } from 'express';
import { currentUserId } from '../../middleware/requireAuth.js';
import { AppError } from '../../shared/AppError.js';
import { sendSuccess } from '../../shared/response.js';
import { isSessionEnd } from './auth.controller.js';
import { staffCookie } from './auth.cookies.js';
import type { LoginInput } from './auth.schemas.js';
import { checkCredentials, getCurrentUser } from './auth.service.js';
import { createSession, endSession, rotateSession } from './auth.sessions.js';
import { signAccessToken } from './auth.tokens.js';

/** The roles that may use the admin panel. */
export const STAFF_ROLES = ['ADMIN', 'DISPATCHER'] as const;

const notStaff = () => AppError.forbidden('This sign-in is for UkRide staff');

/**
 * Staff sign-in for the admin panel. The same email and password as on the
 * customer site, but a separate session: its own cookie, its own token
 * audience, and a lifetime of one working day.
 */
export const staffLogin: RequestHandler = async (req, res) => {
  const user = await checkCredentials(req.body as LoginInput);
  if (!(STAFF_ROLES as readonly string[]).includes(user.role)) throw notStaff();

  const session = await createSession(user.id, { audience: 'STAFF' });

  staffCookie.set(res, session.refreshToken, session.expiresAt);
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, {
    message: 'Signed in',
    data: {
      user,
      ...signAccessToken({ userId: user.id, sessionId: session.sessionId, audience: 'staff' }),
      tokenType: 'Bearer',
    },
  });
};

/** Trades the staff refresh cookie for a new staff access token. */
export const staffRefresh: RequestHandler = async (req, res) => {
  res.set('Cache-Control', 'no-store');

  let session;
  try {
    session = await rotateSession(staffCookie.read(req), 'STAFF');
  } catch (err) {
    if (isSessionEnd(err)) staffCookie.clear(res);
    throw err;
  }

  staffCookie.set(res, session.refreshToken, session.expiresAt);
  sendSuccess(res, {
    message: 'Session refreshed',
    data: { ...signAccessToken({ ...session, audience: 'staff' }), tokenType: 'Bearer' },
  });
};

/** Signs out of the admin panel only. The customer site's sign-in is not touched. */
export const staffLogout: RequestHandler = async (req, res) => {
  await endSession(staffCookie.read(req));

  staffCookie.clear(res);
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, { message: 'Signed out', data: null });
};

/** The signed-in staff member. The route checks the role again on every call. */
export const staffMe: RequestHandler = async (_req, res) => {
  const user = await getCurrentUser(currentUserId(res));

  res.set('Cache-Control', 'no-store');
  sendSuccess(res, { message: 'Signed-in staff member', data: { user } });
};
