import { prisma } from '../../config/db.js';
import { AppError } from '../../shared/AppError.js';
import { profileSelect } from './users.select.js';

/**
 * A valid token for an account that no longer exists is answered as "not
 * signed in": the session has nothing left to belong to.
 */
const accountGone = () => AppError.unauthenticated('Your session is not valid. Sign in again.');

/** The signed-in user's own profile. */
export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: profileSelect });

  if (!user) throw accountGone();
  return user;
}
