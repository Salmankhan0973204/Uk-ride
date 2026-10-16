import { rateLimit } from 'express-rate-limit';
import { isTest } from '../config/env.js';
import { AppError } from '../shared/AppError.js';

interface RateLimitOptions {
  /** How long attempts are remembered. */
  windowMinutes: number;
  /** Attempts allowed from one address inside the window. */
  limit: number;
  /** Count only requests that fail (status 400 or above). Used for sign-in. */
  failuresOnly?: boolean;
  message: string;
  /** Off during automated tests, where every request comes from one address. */
  enabled?: boolean;
}

/**
 * Limits how often one address may call a route.
 *
 * Without it, a script can try thousands of passwords a minute. With it, the
 * route answers 429 once the allowance is used up, and the header
 * `Retry-After` says how many seconds to wait.
 *
 * Counts are kept in this process's memory. That is right for one server;
 * several servers behind a load balancer would share them through Redis.
 */
export function rateLimiter({
  windowMinutes,
  limit,
  failuresOnly = false,
  message,
  enabled = !isTest,
}: RateLimitOptions) {
  return rateLimit({
    windowMs: windowMinutes * 60_000,
    limit,
    skipSuccessfulRequests: failuresOnly,
    skip: () => !enabled,
    // RateLimit-* headers tell a well-behaved client where it stands.
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Pass the refusal to the central error handler, so it has the same
    // envelope as every other error.
    handler: (_req, _res, next) => next(new AppError(429, 'RATE_LIMITED', message)),
  });
}

const TRY_LATER = 'Wait a few minutes and try again.';

/** Sign-in: wrong guesses are what is rationed, so a correct sign-in is free. */
export const loginLimiter = rateLimiter({
  windowMinutes: 15,
  limit: 10,
  failuresOnly: true,
  message: `Too many sign-in attempts. ${TRY_LATER}`,
});

/** Registration: stops one address creating accounts in bulk. */
export const registerLimiter = rateLimiter({
  windowMinutes: 60,
  limit: 10,
  message: 'Too many accounts created from this address. Try again in an hour.',
});

/** Refresh and logout: generous, but not unlimited. */
export const sessionLimiter = rateLimiter({
  windowMinutes: 15,
  limit: 120,
  message: `Too many requests. ${TRY_LATER}`,
});

/**
 * Anything that sends an email. Without a limit, a stranger could fill
 * someone's inbox, or use us to send mail in bulk.
 */
export const emailLimiter = rateLimiter({
  windowMinutes: 60,
  limit: 5,
  message: 'Too many emails requested. Try again in an hour.',
});

/**
 * Choosing a new password with a reset ticket. The ticket is single-use, so
 * this only stops a script hammering the endpoint.
 */
export const resetLimiter = rateLimiter({
  windowMinutes: 15,
  limit: 20,
  message: `Too many attempts. ${TRY_LATER}`,
});

/**
 * Changing a password asks for the current one. Without a limit, someone at
 * an unlocked laptop could use that to guess it. Only wrong attempts count.
 */
export const passwordLimiter = rateLimiter({
  windowMinutes: 15,
  limit: 10,
  failuresOnly: true,
  message: `Too many attempts. ${TRY_LATER}`,
});

/** Quotes are public and cheap to ask for, but each one reads the database. */
export const quoteLimiter = rateLimiter({
  windowMinutes: 15,
  limit: 120,
  message: `Too many quotes asked for. ${TRY_LATER}`,
});

/** Asking for codes: one address may not flood many phones. Each phone has its own limit too. */
export const otpSendLimiter = rateLimiter({
  windowMinutes: 15,
  limit: 10,
  message: `Too many codes asked for from this address. ${TRY_LATER}`,
});

/** Trying codes. Each code also allows only 5 wrong tries. */
export const otpVerifyLimiter = rateLimiter({
  windowMinutes: 15,
  limit: 30,
  message: `Too many code checks from this address. ${TRY_LATER}`,
});

/**
 * Sign-in, any outcome: 5 tries a minute from one address, as on ukride.uk.
 * It sits in front of loginLimiter, which counts wrong passwords over 15 minutes.
 */
export const loginBurstLimiter = rateLimiter({
  windowMinutes: 1,
  limit: 5,
  message: 'Too many sign-in attempts. Wait a minute and try again.',
});
