import type { RequestHandler } from 'express';
import { currentUserId } from '../../middleware/requireAuth.js';
import { AppError } from '../../shared/AppError.js';
import { sendSuccess } from '../../shared/response.js';
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from './auth.cookies.js';
import { requestPasswordReset, resetPassword } from './auth.emails.js';
import type {
  CheckEmailInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from './auth.schemas.js';
import {
  checkCredentials,
  getCurrentUser,
  isEmailAvailable,
  registerUser,
} from './auth.service.js';
import { createSession, endSession, rotateSession, sessionHours } from './auth.sessions.js';
import { signAccessToken } from './auth.tokens.js';

/** True for the 401 that means the session is over, false for a retryable conflict. */
export const isSessionEnd = (err: unknown) => err instanceof AppError && err.statusCode === 401;

/**
 * Creates an account and signs the person in at once, as on ukride.uk: the
 * answer is the same as a login's.
 */
export const register: RequestHandler = async (req, res) => {
  const user = await registerUser(req.body as RegisterInput);
  const session = await createSession(user.id);

  setRefreshCookie(res, session.refreshToken, session.expiresAt);
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, {
    status: 201,
    message: 'Account created',
    data: {
      user,
      ...signAccessToken({ userId: user.id, sessionId: session.sessionId, audience: 'customer' }),
      tokenType: 'Bearer',
    },
  });
};

/** Answers whether an email is free for a new account. */
export const checkEmail: RequestHandler = async (req, res) => {
  const available = await isEmailAvailable((req.body as CheckEmailInput).email);

  res.set('Cache-Control', 'no-store');
  sendSuccess(res, {
    message: available ? 'This email is free' : 'An account with this email already exists',
    data: { available },
  });
};

/**
 * Signs a user in and starts a session. The answer carries two things:
 *   - a short-lived access token in the body, which the client sends back in
 *     the Authorization header as "Bearer <token>";
 *   - a long-lived refresh token in an httpOnly cookie, which only
 *     POST /auth/refresh and POST /auth/logout ever read.
 */
export const login: RequestHandler = async (req, res) => {
  const { rememberMe, ...credentials } = req.body as LoginInput;
  const user = await checkCredentials(credentials);
  const session = await createSession(user.id, {
    lifetimeHours: sessionHours('CUSTOMER', rememberMe),
  });

  setRefreshCookie(res, session.refreshToken, session.expiresAt);
  // A login response holds a credential, so nothing along the way may store it.
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, {
    message: 'Signed in',
    data: {
      user,
      ...signAccessToken({ userId: user.id, sessionId: session.sessionId, audience: 'customer' }),
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
    session = await rotateSession(readRefreshCookie(req), 'CUSTOMER');
  } catch (err) {
    // A cookie that no longer works is removed, so the browser stops sending
    // it. A "try again" keeps it: the browser already holds the newer one.
    if (isSessionEnd(err)) clearRefreshCookie(res);
    throw err;
  }

  setRefreshCookie(res, session.refreshToken, session.expiresAt);
  sendSuccess(res, {
    message: 'Session refreshed',
    data: { ...signAccessToken({ ...session, audience: 'customer' }), tokenType: 'Bearer' },
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

/**
 * Starts a password reset. The answer is the same for every email address, so
 * it never reveals which ones have an account.
 */
export const forgotPassword: RequestHandler = async (req, res) => {
  await requestPasswordReset((req.body as ForgotPasswordInput).email);

  sendSuccess(res, {
    message: 'If that email has an account, we have sent a link to reset the password',
    data: null,
  });
};

/** Sets a new password from the token in the reset link. Signs the user out everywhere. */
export const choosePassword: RequestHandler = async (req, res) => {
  const { token, password } = req.body as ResetPasswordInput;
  await resetPassword(token, password);

  // The browser that did the reset may hold an old session cookie.
  clearRefreshCookie(res);
  sendSuccess(res, { message: 'Password changed. Sign in with your new password', data: null });
};
