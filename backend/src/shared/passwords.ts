import bcrypt from 'bcryptjs';
import { isTest } from '../config/env.js';

/**
 * bcrypt work factor: each step up doubles the time one hash takes.
 * 12 is slow enough to make guessing expensive; tests use the minimum.
 */
const HASH_COST = isTest ? 4 : 12;

/** Turns a password into the hash that is stored. The password itself never is. */
export function hashPassword(password: string) {
  return bcrypt.hash(password, HASH_COST);
}

/** Does this password match the stored hash? */
export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}
