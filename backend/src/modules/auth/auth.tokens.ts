import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

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
    // Named explicitly so a token signed any other way is never accepted.
    algorithm: 'HS256',
  });

  return { accessToken, expiresIn };
}
