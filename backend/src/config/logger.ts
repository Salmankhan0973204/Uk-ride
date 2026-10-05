import { pino } from 'pino';
import { env, isProd, isTest } from './env.js';

/**
 * Structured logger.
 * - test: silent, so test output stays readable.
 * - development: pretty-printed.
 * - production: raw JSON lines.
 * Sensitive fields are redacted so they never reach the logs.
 */
export const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
    censor: '[redacted]',
  },
  transport:
    !isProd && !isTest
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
});
