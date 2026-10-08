import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/AppError.js';

// Named in both directions, so a token signed any other way is never accepted.
const ALGORITHM = 'HS256';

/** What an access token says: who, and in which session. */
export interface AccessClaims {
  userId: string;
  sessionId: string;
}

/**
 * An access token is a signed note saying "this is user <id>, in session
 * <sid>, until <time>". It is signed, not encrypted: anyone holding it can
 * read it, so it carries ids only.
 */
export function signAccessToken({ userId, sessionId }: AccessClaims) {
  const expiresIn = env.JWT_ACCESS_TTL_SECONDS;

  const accessToken = jwt.sign({ sid: sessionId }, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn,
    algorithm: ALGORITHM,
  });

  return { accessToken, expiresIn };
}

/**
 * Returns what a token says, or throws 401.
 * A token passes only if this API signed it, with the expected algorithm, and
 * it has not expired. Everything else gets the same answer except expiry,
 * which is safe to name and tells the client to refresh or sign in again.
 *
 * This checks the token itself. Whether its session is still alive is a
 * separate question, answered by requireAuth.
 */
export function verifyAccessToken(token: string): AccessClaims {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: [ALGORITHM] });

    if (typeof payload === 'string' || !payload.sub || typeof payload.sid !== 'string') {
      throw new Error('token is missing its user or session');
    }
    return { userId: payload.sub, sessionId: payload.sid };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.unauthenticated('Your session has expired. Sign in again.');
    }
    throw AppError.unauthenticated('Your session is not valid. Sign in again.');
  }
}
