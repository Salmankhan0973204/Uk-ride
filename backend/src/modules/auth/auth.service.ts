import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db.js';
import { isTest } from '../../config/env.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../shared/AppError.js';
import { publicUser } from '../users/users.select.js';
import { sendInBackground, sendVerificationEmail } from './auth.emails.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

/**
 * bcrypt work factor: each step up doubles the time one hash takes.
 * 12 is slow enough to make guessing expensive; tests use the minimum.
 */
const HASH_COST = isTest ? 4 : 12;

/**
 * Throws 409 when the email or the mobile number belongs to an account.
 * `details.field` tells the client which input to mark.
 */
async function assertNotTaken(email: string, mobile: string) {
  const taken = await prisma.user.findFirst({
    where: { OR: [{ email }, { mobile }] },
    select: { email: true },
  });
  if (!taken) return;

  if (taken.email === email) {
    throw AppError.conflict('An account with this email already exists', { field: 'email' });
  }
  throw AppError.conflict('An account with this mobile number already exists', {
    field: 'mobile',
  });
}

export async function registerUser({ password, gender, ...profile }: RegisterInput) {
  await assertNotTaken(profile.email, profile.mobile);

  const passwordHash = await bcrypt.hash(password, HASH_COST);

  try {
    const user = await prisma.user.create({
      data: { ...profile, gender: gender ?? null, passwordHash },
      select: publicUser,
    });
    // Not awaited: the account exists whether or not the email goes out.
    sendInBackground(sendVerificationEmail(user), 'confirmation');
    return user;
  } catch (err) {
    // Two requests with the same email or mobile can both pass the check
    // above. The unique index stops the second one; P2002 is Prisma's code for
    // that. Checking again finds out which of the two it was.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      await assertNotTaken(profile.email, profile.mobile);
      throw AppError.conflict('An account with these details already exists');
    }
    throw err;
  }
}

/**
 * A hash of a throwaway value, made once. When no account matches the email,
 * the password is still compared against this, so "unknown email" takes as
 * long as "wrong password" and timing does not reveal which emails exist.
 */
let decoyHash: Promise<string> | undefined;
const getDecoyHash = () => (decoyHash ??= bcrypt.hash('no-such-account', HASH_COST));

/**
 * Checks an email and password and returns the user they belong to.
 * Both ways of failing give the same answer: saying "no such email" would let
 * anyone test which addresses have accounts.
 */
export async function checkCredentials({ email, password }: LoginInput) {
  const found = await prisma.user.findUnique({
    where: { email },
    select: { ...publicUser, passwordHash: true },
  });

  const passwordMatches = await bcrypt.compare(
    password,
    found?.passwordHash ?? (await getDecoyHash()),
  );

  if (!found || !passwordMatches) {
    throw AppError.unauthenticated('Email or password is incorrect');
  }

  // The hash was needed for the check only. It never leaves this function.
  const { passwordHash: _passwordHash, ...user } = found;

  return user;
}

/**
 * The signed-in user, read fresh from the database.
 * A token stays valid until it expires even if the account is deleted in the
 * meantime, so "no such user" is answered as "not signed in".
 */
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUser });

  if (!user) {
    throw AppError.unauthenticated('Your session is not valid. Sign in again.');
  }
  return user;
}
