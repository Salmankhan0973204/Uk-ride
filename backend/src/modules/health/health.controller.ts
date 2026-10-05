import type { RequestHandler } from 'express';
import { APP_VERSION, SERVICE_NAME, env } from '../../config/env.js';
import { sendSuccess } from '../../shared/response.js';

/** General service information. Used by the frontend system-status screen. */
export const getHealth: RequestHandler = (_req, res) => {
  sendSuccess(res, {
    message: 'API is healthy',
    data: {
      status: 'ok',
      service: SERVICE_NAME,
      version: APP_VERSION,
      env: env.NODE_ENV,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
};

/** Liveness: the process is running and can answer HTTP. */
export const getLive: RequestHandler = (_req, res) => {
  sendSuccess(res, { message: 'Process is alive', data: { status: 'live' } });
};

/**
 * Readiness: dependencies are reachable.
 * The database and Redis checks are added when those services arrive
 * (Module 1 and Module 11).
 */
export const getReady: RequestHandler = (_req, res) => {
  sendSuccess(res, {
    message: 'Service is ready',
    data: {
      status: 'ready',
      checks: {
        database: { status: 'skipped', note: 'Added in Module 1 (PostgreSQL + Prisma)' },
        redis: { status: 'skipped', note: 'Added in Module 11 (Redis + BullMQ)' },
      },
    },
  });
};
