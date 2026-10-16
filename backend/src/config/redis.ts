import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * The one Redis client of the API. Redis keeps short-lived counters that
 * must be shared by every API process, such as how many codes were sent to
 * one phone number in the last hour.
 *
 * It connects on first use. A command fails at once when Redis is down
 * instead of queueing, so a request never hangs on it; callers decide what
 * a failure means.
 */
export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  connectTimeout: 2_000,
});

redis.on('error', (err) => logger.warn({ err: err.message }, 'Redis connection problem'));

/** Connects if needed. Safe to call many times. */
export async function ensureRedis() {
  if (redis.status === 'wait' || redis.status === 'end') await redis.connect();
}

/** True when Redis answers PING. Used by the readiness check. */
export async function redisIsUp() {
  try {
    await ensureRedis();
    return (await redis.ping()) === 'PONG';
  } catch {
    return false;
  }
}
