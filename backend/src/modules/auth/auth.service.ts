import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db.js';
import { isTest } from '../../config/env.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../shared/AppError.js';
import type { RegisterInput } from './auth.schemas.js';

/**
 * bcrypt work factor: each step up doubles the time one hash takes.
 * 12 is slow enough to make guessing expensive; tests use the minimum.
 */
const HASH_COST = isTest ? 4 : 12;

/** The user fields that are safe to send to a client. Never the hash. */
const publicUser = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  mobile: true,
  gender: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

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
    return await prisma.user.create({
      data: { ...profile, gender: gender ?? null, passwordHash },
      select: publicUser,
    });
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
