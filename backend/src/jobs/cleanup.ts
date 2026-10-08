import { logger } from '../config/logger.js';
import { deleteExpiredSessions } from '../modules/auth/auth.sessions.js';

const HOUR_MS = 60 * 60 * 1000;
/** A refresh token lives for days, so sweeping a few times a day is plenty. */
const EVERY_MS = 6 * HOUR_MS;
/** Let the server finish starting before the first sweep. */
const FIRST_RUN_MS = 30_000;

/** One sweep. A failure is logged and never thrown: clean-up must not take the API down. */
export async function runCleanup() {
  try {
    const removed = await deleteExpiredSessions();
    logger.info({ removed }, 'Clean-up: expired refresh tokens removed');
    return removed;
  } catch (err) {
    logger.error({ err }, 'Clean-up failed; it will run again at the next interval');
    return 0;
  }
}

/**
 * Starts the periodic sweep and returns a function that stops it.
 *
 * This is a plain timer inside the API process. It is enough for one server.
 * With several servers each would run it, which is harmless here (deleting
 * what is already deleted) but wasteful; a queue with a single scheduler
 * (Module 11) is the place for that.
 */
export function startCleanupJob() {
  // unref(): a pending timer must not keep the process alive on shutdown.
  const first = setTimeout(() => void runCleanup(), FIRST_RUN_MS).unref();
  const repeat = setInterval(() => void runCleanup(), EVERY_MS).unref();

  return () => {
    clearTimeout(first);
    clearInterval(repeat);
  };
}
