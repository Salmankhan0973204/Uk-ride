import type { RequestHandler } from 'express';
import { prisma } from '../config/db.js';
import type { Role } from '../generated/prisma/client.js';
import { AppError } from '../shared/AppError.js';
import { currentUserId } from './requireAuth.js';

/**
 * Lets a request through only when the signed-in user has one of the roles
 * named. It goes after requireAuth, which has already answered "who is this":
 *
 *   router.use(requireAuth, requireRole('ADMIN'));
 *
 * Two different refusals. 401 means "we do not know who you are": sign in.
 * 403 means "we know who you are, and this is not yours to do": signing in
 * again will not help.
 *
 * The role is read from the database on every request, not carried in the
 * access token. A token lives for 15 minutes, so a role inside it would keep
 * working for up to 15 minutes after an admin was demoted.
 */
export function requireRole(...allowed: Role[]): RequestHandler {
  return async (_req, res, next) => {
    const user = await prisma.user.findUnique({
      where: { id: currentUserId(res) },
      select: { role: true },
    });

    if (!user || !allowed.includes(user.role)) {
      throw AppError.forbidden();
    }
    next();
  };
}
