import { prisma } from '../../config/db.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../shared/AppError.js';
import { hashPassword, verifyPassword } from '../../shared/passwords.js';
import { endAllSessions } from '../auth/auth.sessions.js';
import type { ChangePasswordInput, UpdateProfileInput } from './users.schemas.js';
import { profileSelect } from './users.select.js';

/**
 * A valid token for an account that no longer exists is answered as "not
 * signed in": the session has nothing left to belong to.
 */
const accountGone = () => AppError.unauthenticated('Your session is not valid. Sign in again.');

const mobileTaken = () =>
  AppError.conflict('An account with this mobile number already exists', { field: 'mobile' });

/** Prisma's code for "a unique index refused this" and for "no such row". */
const isPrismaError = (err: unknown, code: string) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === code;

/** The signed-in user's own profile. */
export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: profileSelect });

  if (!user) throw accountGone();
  return user;
}

/**
 * Changes the fields that were sent and leaves the rest alone.
 *
 * Prisma skips a key whose value is `undefined`, so passing the validated
 * body straight through writes exactly what the client asked for. `null` is
 * different from "not sent": it is a value, and it clears the column.
 */
export async function updateProfile(userId: string, changes: UpdateProfileInput) {
  if (changes.mobile) {
    const other = await prisma.user.findFirst({
      where: { mobile: changes.mobile, NOT: { id: userId } },
      select: { id: true },
    });
    if (other) throw mobileTaken();
  }

  try {
    return await prisma.user.update({
      where: { id: userId },
      data: changes,
      select: profileSelect,
    });
  } catch (err) {
    // Someone else took the number between the check and the write.
    if (isPrismaError(err, 'P2002')) throw mobileTaken();
    // The account was deleted while this request was on its way.
    if (isPrismaError(err, 'P2025')) throw accountGone();
    throw err;
  }
}

/**
 * Changes the password of a signed-in user.
 *
 * A valid session is not enough: the current password is asked for again.
 * That way an unlocked phone or a stolen access token cannot be turned into
 * permanent control of the account.
 *
 * A wrong current password is a 400 on that field, not a 401. The session is
 * fine; it is the form that is wrong, and a 401 would make the web app try to
 * refresh the session and sign the person out.
 *
 * Afterwards every other session of the user is ended, and the one making
 * the request is kept: you stay signed in here, and nowhere else.
 */
export async function changePassword(
  userId: string,
  sessionId: string,
  { currentPassword, newPassword }: ChangePasswordInput,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) throw accountGone();

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw AppError.validation({ currentPassword: ['Current password is incorrect'] });
  }
  if (newPassword === currentPassword) {
    throw AppError.validation({
      newPassword: ['Choose a password that is different from your current one'],
    });
  }

  const passwordHash = await hashPassword(newPassword);

  // Both changes happen, or neither does.
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    endAllSessions(userId, { sessionId }),
  ]);
}
