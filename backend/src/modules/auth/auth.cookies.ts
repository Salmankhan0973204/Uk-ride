import type { CookieOptions, Request, Response } from 'express';
import { isProd } from '../../config/env.js';

/**
 * A refresh cookie and everything needed to set, clear and read it.
 *
 * How it is locked down:
 *   httpOnly  page scripts cannot read it, so injected script cannot steal it
 *   secure    HTTPS only in production (plain http://localhost in development)
 *   sameSite  strict: the browser sends it only from our own site, which
 *             stops other sites from triggering a refresh or logout
 *   path      sent to its own auth endpoints only, never to the rest of the API
 *
 * Customers and staff each have one, with different names and paths. Cookies
 * ignore ports, so the customer site (3000) and the admin panel (3001) on
 * localhost would otherwise share one, and their sign-ins would collide.
 */
function refreshCookie(name: string, path: string) {
  const baseOptions: CookieOptions = { httpOnly: true, secure: isProd, sameSite: 'strict', path };

  return {
    name,
    set(res: Response, refreshToken: string, expiresAt: Date) {
      res.cookie(name, refreshToken, { ...baseOptions, expires: expiresAt });
    },
    /** The options must match the ones used to set it, or the browser keeps the cookie. */
    clear(res: Response) {
      res.clearCookie(name, baseOptions);
    },
    read(req: Request): string | undefined {
      const value: unknown = (req.cookies as Record<string, unknown> | undefined)?.[name];
      return typeof value === 'string' && value ? value : undefined;
    },
  };
}

export const customerCookie = refreshCookie('ukride_refresh', '/api/v1/auth');
export const staffCookie = refreshCookie('ukride_staff_refresh', '/api/v1/admin/auth');

export const REFRESH_COOKIE = customerCookie.name;
export const setRefreshCookie = customerCookie.set;
export const clearRefreshCookie = customerCookie.clear;
export const readRefreshCookie = customerCookie.read;
