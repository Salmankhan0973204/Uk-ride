import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import type { SessionAudience } from '../../generated/prisma/client.js';
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

const HOUR_MS = 60 * 60 * 1000;

/**
 * How long a session lasts, chosen when it starts and kept by every refresh:
 *   - a customer who ticked "Remember me": REMEMBER_ME_DAYS (30)
 *   - a customer who did not: CUSTOMER_SESSION_HOURS (24)
 *   - staff: STAFF_SESSION_HOURS (12), because the admin panel moves money
 */
export function sessionHours(audience: SessionAudience, rememberMe = false) {
  if (audience === 'STAFF') return env.STAFF_SESSION_HOURS;
  return rememberMe ? env.REMEMBER_ME_DAYS * 24 : env.CUSTOMER_SESSION_HOURS;
}

/**
 * Two refreshes a moment apart with the same cookie are normal: two tabs
 * opened together, or a page that reloads while a refresh is under way. The
 * later one finds the token already exchanged. Within this window that is
 * not treated as a stolen token, which would sign the person out everywhere.
 * After the window, a used token coming back is still a replay.
 */
const REUSE_GRACE_MS = 30_000;

export const refreshConflict = () =>
  new AppError(409, 'CONFLICT', 'Your session was refreshed a moment ago. Try again.', {
    retry: true,
  });

/** SHA-256 is enough here: the token is 256 random bits, not a guessable password. */
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export const sessionEnded = () =>
  AppError.unauthenticated('Your session has ended. Sign in again.');

/** Issues a refresh token inside a session. A new session gets a new id. */
export async function createSession(
  userId: string,
  {
    audience = 'CUSTOMER',
    sessionId = randomUUID(),
    lifetimeHours = sessionHours(audience),
  }: { audience?: SessionAudience; sessionId?: string; lifetimeHours?: number } = {},
) {
  const refreshToken = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + lifetimeHours * HOUR_MS);

  await prisma.refreshToken.create({
    data: {
      userId,
      sessionId,
      audience,
      lifetimeHours,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    },
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
export async function rotateSession(
  refreshToken: string | undefined,
  audience: SessionAudience = 'CUSTOMER',
) {
  if (!refreshToken) throw sessionEnded();

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
  });
  // A staff cookie is no good at the customer endpoint, and the other way round.
  if (!stored || stored.audience !== audience) throw sessionEnded();

  if (stored.revokedAt) {
    // Exchanged a moment ago: two tabs refreshing together, or a page that
    // was left before the answer with the new cookie arrived.
    if (Date.now() - stored.revokedAt.getTime() < REUSE_GRACE_MS) {
      return renewLostToken(stored, audience);
    }

    // Exchanged long ago and presented again. Either it was stolen or the
    // real owner is replaying it; nobody can tell which, so all of the
    // user's sessions end.
    await endAllSessions(stored.userId);
    throw sessionEnded();
  }

  if (stored.expiresAt <= new Date()) throw sessionEnded();

  return claimAndRenew(stored, audience);
}

type StoredToken = NonNullable<Awaited<ReturnType<typeof prisma.refreshToken.findUnique>>>;

/**
 * Marks a token as used and issues the next one in the same session.
 * "revokedAt is still null" is part of the update, so of two requests
 * arriving together with the same token only one can win.
 */
async function claimAndRenew(token: StoredToken, audience: SessionAudience) {
  const claimed = await prisma.refreshToken.updateMany({
    where: { id: token.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  // The loser of such a tie is told to try again, and nothing is revoked:
  // two tabs of the same browser refreshing in the same instant is not an attack.
  if (claimed.count !== 1) throw refreshConflict();

  return {
    userId: token.userId,
    // The new token keeps the lifetime chosen at sign-in.
    ...(await createSession(token.userId, {
      audience,
      sessionId: token.sessionId,
      lifetimeHours: token.lifetimeHours,
    })),
  };
}

/**
 * A token used a moment ago has come back. Most likely the browser never
 * received the token that replaced it: the page was left or reloaded while the
 * refresh was answering, so the new cookie was dropped, perhaps several times
 * in a row. Waiting would not help, as the browser can only ever send the old
 * one, and after the grace window that would end every session. So the
 * session's live token is used up in its place and a fresh one is issued.
 *
 * Every token after this one was made inside the grace window, so this hands
 * out nothing older than the window already allowed.
 *
 * With no live token, another refresh of this session is half done (its token
 * claimed, the next not yet saved), and "try again" is the right answer.
 */
async function renewLostToken(stored: StoredToken, audience: SessionAudience) {
  const live = await prisma.refreshToken.findFirst({
    where: { sessionId: stored.sessionId, revokedAt: null, createdAt: { gt: stored.createdAt } },
    orderBy: { createdAt: 'desc' },
  });
  if (!live) throw refreshConflict();
  if (live.expiresAt <= new Date()) throw sessionEnded();

  return claimAndRenew(live, audience);
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
