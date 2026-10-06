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
const publicUser = { id: true, email: true, createdAt: true } satisfies Prisma.UserSelect;

const emailTaken = () => AppError.conflict('An account with this email already exists');

export async function registerUser({ email, password }: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw emailTaken();
  }

  const passwordHash = await bcrypt.hash(password, HASH_COST);

  try {
    return await prisma.user.create({ data: { email, passwordHash }, select: publicUser });
  } catch (err) {
    // Two requests with the same email can both pass the check above. The
    // unique index stops the second one; P2002 is Prisma's code for that.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw emailTaken();
    }
    throw err;
  }
}
