import type { ErrorRequestHandler } from 'express';
import { isProd } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../shared/AppError.js';
import type { ApiFailure } from '../shared/response.js';

interface HttpLikeError {
  type?: string;
  message?: string;
  stack?: string;
}

/**
 * Central error handler. It must keep four arguments so Express treats it as
 * error middleware. Every failure leaves the API in the same envelope, and
 * stack traces are never sent to the client in production.
 */
export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const requestId = String(res.locals.requestId ?? 'unknown');
  const raw = (err ?? {}) as HttpLikeError;

  let appError: AppError;
  let unexpected = false;

  if (err instanceof AppError) {
    appError = err;
  } else if (raw.type === 'entity.parse.failed') {
    appError = AppError.badRequest('Request body is not valid JSON');
  } else if (raw.type === 'entity.too.large') {
    appError = new AppError(413, 'BAD_REQUEST', 'Request body is too large');
  } else {
    unexpected = true;
    appError = AppError.internal(
      isProd ? 'Internal server error' : (raw.message ?? 'Internal server error'),
    );
  }

  const log = req.log ?? logger;
  if (unexpected) {
    log.error({ err, requestId }, 'Unhandled error');
  } else if (appError.statusCode >= 500) {
    log.error({ err: appError, requestId }, appError.message);
  } else {
    log.warn({ code: appError.code, requestId }, appError.message);
  }

  let details = appError.details;
  if (unexpected && !isProd && raw.stack) {
    details = { stack: raw.stack.split('\n').map((line) => line.trim()) };
  }

  const body: ApiFailure = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
      ...(details !== undefined ? { details } : {}),
    },
    requestId,
  };

  res.status(appError.statusCode).json(body);
};
