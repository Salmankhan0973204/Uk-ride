import cors from 'cors';
import express from 'express';
import type { Response } from 'express';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { requestId } from './middleware/requestId.js';
import { healthRouter } from './modules/health/health.routes.js';

/**
 * Builds the Express application without starting a server.
 * Keeping app and server apart lets tests call the app directly.
 *
 * Middleware order matters:
 * request id -> logging -> CORS -> body parsing -> routes -> 404 -> errors
 */
export const app = express();

app.disable('x-powered-by');

app.use(requestId);
app.use(
  pinoHttp({
    logger,
    genReqId: (_req, res) => String((res as Response).locals.requestId),
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

const api = express.Router();
api.use('/health', healthRouter);

app.use('/api/v1', api);

app.use(notFound);
app.use(errorHandler);
