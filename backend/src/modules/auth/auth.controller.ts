import type { RequestHandler } from 'express';
import { currentUserId } from '../../middleware/requireAuth.js';
import { sendSuccess } from '../../shared/response.js';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from './auth.cookies.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import { checkCredentials, getCurrentUser, registerUser } from './auth.service.js';
import { createSession, endSession, rotateSession } from './auth.sessions.js';
import { signAccessToken } from './auth.tokens.js';

/** Creates an account. The body was already checked by the validate middleware. */
export const register: RequestHandler = async (req, res) => {
  const user = await registerUser(req.body as RegisterInput);

  sendSuccess(res, { status: 201, message: 'Account created', data: { user } });
};

/**
 * Signs a user in and starts a session. The answer carries two things:
 *   - a short-lived access token in the body, which the client sends back in
 *     the Authorization header as "Bearer <token>";
 *   - a long-lived refresh token in an httpOnly cookie, which only
 *     POST /auth/refresh and POST /auth/logout ever read.
 */
export const login: RequestHandler = async (req, res) => {
  const user = await checkCredentials(req.body as LoginInput);
  const session = await createSession(user.id);

  setRefreshCookie(res, session.refreshToken, session.expiresAt);
  // A login response holds a credential, so nothing along the way may store it.
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, {
    message: 'Signed in',
    data: {
      user,
      ...signAccessToken({ userId: user.id, sessionId: session.sessionId }),
      tokenType: 'Bearer',
    },
  });
};

/**
 * Trades the refresh cookie for a new access token, and replaces the cookie
 * with a new refresh token. Called when the access token has expired.
 */
export const refresh: RequestHandler = async (req, res) => {
  res.set('Cache-Control', 'no-store');

  let session;
  try {
    session = await rotateSession(readRefreshCookie(req));
  } catch (err) {
    // A cookie that no longer works is removed, so the browser stops sending it.
    clearRefreshCookie(res);
    throw err;
  }

  setRefreshCookie(res, session.refreshToken, session.expiresAt);
  sendSuccess(res, {
    message: 'Session refreshed',
    data: { ...signAccessToken(session), tokenType: 'Bearer' },
  });
};

/**
 * Signs out: the session ends on the server and the cookie is removed. The
 * access token stops working too, because its session is gone. Always
 * succeeds, so signing out twice is not an error.
 */
export const logout: RequestHandler = async (req, res) => {
  await endSession(readRefreshCookie(req));

  clearRefreshCookie(res);
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, { message: 'Signed out', data: null });
};

/** Who am I? Runs only after requireAuth has accepted the token. */
export const me: RequestHandler = async (_req, res) => {
  const user = await getCurrentUser(currentUserId(res));

  // Personal data for one user: no shared cache may keep it.
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, { message: 'Signed-in user', data: { user } });
};
