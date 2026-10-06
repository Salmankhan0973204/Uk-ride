import type { RequestHandler } from 'express';
import { prisma } from '../../config/db.js';
import { APP_VERSION, SERVICE_NAME, env } from '../../config/env.js';
import { AppError } from '../../shared/AppError.js';
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
 * Answers 503 when the database cannot be queried, so a load balancer can
 * stop sending traffic. The Redis check is added in Module 11.
 */
export const getReady: RequestHandler = async (req, res) => {
  const redis = { status: 'skipped', note: 'Added in Module 11 (Redis + BullMQ)' };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    // The reason stays in the log; connection details do not belong in a response.
    req.log?.error({ err }, 'Database readiness check failed');
    throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Service is not ready', {
      checks: { database: { status: 'down' }, redis },
    });
  }

  sendSuccess(res, {
    message: 'Service is ready',
    data: { status: 'ready', checks: { database: { status: 'up' }, redis } },
  });
};
