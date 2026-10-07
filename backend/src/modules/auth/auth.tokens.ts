import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/AppError.js';

// Named in both directions, so a token signed any other way is never accepted.
const ALGORITHM = 'HS256';

/**
 * An access token is a signed note saying "this is user <id>, until <time>".
 * The API can check the signature without a database lookup. It is signed, not
 * encrypted: anyone holding it can read it, so it carries the user id only.
 */
export function signAccessToken(userId: string) {
  const expiresIn = env.JWT_ACCESS_TTL_SECONDS;

  const accessToken = jwt.sign({}, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn,
    algorithm: ALGORITHM,
  });

  return { accessToken, expiresIn };
}

/**
 * Returns the user id inside a token, or throws 401.
 * A token passes only if this API signed it, with the expected algorithm, and
 * it has not expired. Everything else gets the same answer except expiry,
 * which is safe to name and tells the client to sign in again.
 */
export function verifyAccessToken(token: string): string {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: [ALGORITHM] });

    if (typeof payload === 'string' || !payload.sub) {
      throw new Error('token has no subject');
    }
    return payload.sub;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.unauthenticated('Your session has expired. Sign in again.');
    }
    throw AppError.unauthenticated('Your session is not valid. Sign in again.');
  }
}
