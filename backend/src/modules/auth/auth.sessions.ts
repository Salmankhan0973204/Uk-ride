import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/AppError.js';

/**
 * Sessions and refresh tokens: what keeps someone signed in after the
 * 15-minute access token runs out.
 *
 * A session is one sign-in on one device. It has an id that never changes.
 * A refresh token is a long random string, not a JWT. The browser keeps it in
 * an httpOnly cookie; the database keeps only its SHA-256 hash. Each token
 * works once: using it marks it as used and issues the next one in the same
 * session (rotation). If a used token ever comes back, it was copied, so every
 * session of that user is ended.
 *
 * Two different things can stop a token working, and they are kept apart:
 *   - used    it was exchanged for a newer one. The row stays, marked with
 *             `revokedAt`, as the evidence that lets a replay be recognised.
 *   - ended   the session was signed out, or the password changed. The rows
 *             are deleted. A browser that still holds such a token is told
 *             "sign in again" and nothing else happens.
 * Mixing the two up would let a signed-out phone, simply by retrying, sign
 * out the laptop that had just changed the password.
 *
 * The access token carries the session id too. A protected request is only
 * accepted while its session is alive, so signing out works at once instead
 * of when the access token expires.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** SHA-256 is enough here: the token is 256 random bits, not a guessable password. */
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export const sessionEnded = () =>
  AppError.unauthenticated('Your session has ended. Sign in again.');

/** Issues a refresh token inside a session. A new session gets a new id. */
export async function createSession(userId: string, sessionId: string = randomUUID()) {
  const refreshToken = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS);

  await prisma.refreshToken.create({
    data: { userId, sessionId, tokenHash: hashToken(refreshToken), expiresAt },
  });

  return { sessionId, refreshToken, expiresAt };
}

/**
 * Signs a user out everywhere, or everywhere except one session. Returns the
 * query without running it, so a caller can put it inside a transaction.
 */
export function endAllSessions(userId: string, except?: { sessionId: string }) {
  return prisma.refreshToken.deleteMany({
    where: { userId, ...(except ? { NOT: { sessionId: except.sessionId } } : {}) },
  });
}

/**
 * Exchanges a refresh token for a new one in the same session. The old token
 * stops working. Returns the user id, session id and new token, or throws 401.
 */
export async function rotateSession(refreshToken: string | undefined) {
  if (!refreshToken) throw sessionEnded();

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  });
  if (!stored) throw sessionEnded();

  // A token that was already exchanged for a newer one is being presented
  // again. Either it was stolen or the real owner is replaying it; nobody can
  // tell which, so all of the user's sessions end.
  if (stored.revokedAt) {
    await endAllSessions(stored.userId);
    throw sessionEnded();
  }

  if (stored.expiresAt <= new Date()) throw sessionEnded();

  // Claim the token. "revokedAt is still null" is part of the update, so of
  // two requests arriving together with the same token only one can win.
  const claimed = await prisma.refreshToken.updateMany({
    where: { id: stored.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  // The loser of such a tie is refused, but nothing else is revoked: two tabs
  // of the same browser refreshing in the same instant is not an attack.
  if (claimed.count !== 1) throw sessionEnded();

  return { userId: stored.userId, ...(await createSession(stored.userId, stored.sessionId)) };
}

/** Ends the session a refresh token belongs to. Safe with no token or an unknown one. */
export async function endSession(refreshToken: string | undefined) {
  if (!refreshToken) return;

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  });
  if (!stored) return;

  // Every token of the session goes, the used ones included.
  await prisma.refreshToken.deleteMany({ where: { sessionId: stored.sessionId } });
}

/**
 * Is this session still signed in? True while it has a refresh token that is
 * neither used up nor expired. Asked on every protected request.
 */
export async function isSessionActive(sessionId: string) {
  const live = await prisma.refreshToken.findFirst({
    where: { sessionId, revokedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  return live !== null;
}

/**
 * Deletes refresh tokens that have expired, and returns how many.
 *
 * A token that was used but has not expired yet is kept on purpose: if it shows up again, rotateSession() must still be able to
 * recognise it as a replay. Once expired it is useless to everyone.
 */
export async function deleteExpiredSessions() {
  const { count } = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
}
