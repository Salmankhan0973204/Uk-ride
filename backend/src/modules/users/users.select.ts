import type { Prisma } from '../../generated/prisma/client.js';

/**
 * Which columns of a user may leave the server.
 *
 * Prisma returns only what a `select` lists, so the password hash can never
 * be sent by accident: it is not on either list. Every query that answers a
 * client uses one of these two.
 */

/** The user as shown after signing in. */
export const publicUser = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  mobile: true,
  gender: true,
  emailVerifiedAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

/** The profile: the same fields, plus when it was last changed. */
export const profileSelect = { ...publicUser, updatedAt: true } satisfies Prisma.UserSelect;
