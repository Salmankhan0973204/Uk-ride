import type { CookieOptions, Request, Response } from 'express';
import { isProd } from '../../config/env.js';

export const REFRESH_COOKIE = 'ukride_refresh';

/**
 * How the refresh cookie is locked down:
 *   httpOnly  page scripts cannot read it, so injected script cannot steal it
 *   secure    HTTPS only in production (plain http://localhost in development)
 *   sameSite  strict: the browser sends it only from our own site, which
 *             stops other sites from triggering a refresh or logout
 *   path      sent to the auth endpoints only, never to the rest of the API
 */
const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
  path: '/api/v1/auth',
};

export function setRefreshCookie(res: Response, refreshToken: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE, refreshToken, { ...baseOptions, expires: expiresAt });
}

/** The options must match the ones used to set it, or the browser keeps the cookie. */
export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, baseOptions);
}

export function readRefreshCookie(req: Request): string | undefined {
  const value: unknown = (req.cookies as Record<string, unknown> | undefined)?.[REFRESH_COOKIE];
  return typeof value === 'string' && value ? value : undefined;
}
