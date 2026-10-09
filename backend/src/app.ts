import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import type { Response } from 'express';
import { pinoHttp } from 'pino-http';
import { env, isProd } from './config/env.js';
import { logger } from './config/logger.js';
import { docsRouter } from './docs/docs.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { requestId } from './middleware/requestId.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { adminVehicleTypesRouter } from './modules/vehicle-types/vehicle-types.admin.routes.js';
import { vehicleTypesRouter } from './modules/vehicle-types/vehicle-types.routes.js';

/**
 * Builds the Express application without starting a server.
 * Keeping app and server apart lets tests call the app directly.
 *
 * Middleware order matters:
 * request id -> logging -> CORS -> body and cookie parsing -> routes -> 404 -> errors
 */
export const app = express();

app.disable('x-powered-by');

app.use(requestId);
app.use(
  pinoHttp({
    logger,
    genReqId: (_req, res) => String((res as Response).locals.requestId),
    // Keep request logs short: method, path, status and duration are enough.
    serializers: {
      req: (req: { method: string; url: string }) => ({ method: req.method, url: req.url }),
      res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
    },
    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  }),
);
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    exposedHeaders: ['x-request-id'],
  }),
);
app.use(express.json({ limit: '1mb' }));
// Fills req.cookies. The refresh token arrives this way.
app.use(cookieParser());

const api = express.Router();
api.use('/health', healthRouter);
api.use('/auth', authRouter);
api.use('/users', usersRouter);
api.use('/vehicle-types', vehicleTypesRouter);
// Everything under /admin is for the operator's staff.
api.use('/admin/vehicle-types', adminVehicleTypesRouter);
// Swagger UI is a development tool; it is not exposed in production.
if (!isProd) {
  api.use('/docs', docsRouter);
}

app.use('/api/v1', api);

app.use(notFound);
app.use(errorHandler);
