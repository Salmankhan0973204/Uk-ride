import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/AppError.js';

/**
 * Refresh tokens: what keeps someone signed in after the 15-minute access
 * token runs out.
 *
 * A refresh token is a long random string, not a JWT. The browser keeps it in
 * an httpOnly cookie; the database keeps only its SHA-256 hash. Each token
 * works once: using it revokes it and issues the next one (rotation). If a
 * revoked token ever comes back, it was copied, so every session of that user
 * is ended.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** SHA-256 is enough here: the token is 256 random bits, not a guessable password. */
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const sessionEnded = () => AppError.unauthenticated('Your session has ended. Sign in again.');

/** Starts a session for a user and returns the token to hand to the browser. */
export async function createSession(userId: string) {
  const refreshToken = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS);

  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(refreshToken), expiresAt },
  });

  return { refreshToken, expiresAt };
}

/** Signs a user out everywhere. */
function revokeAllSessions(userId: string) {
  return prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Exchanges a refresh token for a new one. The old token stops working.
 * Returns the user id and the new token, or throws 401.
 */
export async function rotateSession(refreshToken: string | undefined) {
  if (!refreshToken) throw sessionEnded();

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  });
  if (!stored) throw sessionEnded();

  // A token that was already used or signed out is being presented again.
  // Either it was stolen or the real owner is replaying it; nobody can tell
  // which, so all of the user's sessions end.
  if (stored.revokedAt) {
    await revokeAllSessions(stored.userId);
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

  return { userId: stored.userId, ...(await createSession(stored.userId)) };
}

/** Ends one session. Safe to call with no token or an unknown one. */
export async function endSession(refreshToken: string | undefined) {
  if (!refreshToken) return;

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
