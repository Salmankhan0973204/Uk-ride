import type { Response } from 'express';
import type { ErrorCode } from './AppError.js';

/** Standard success envelope used by every endpoint. */
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

/** Standard error envelope produced by the error handler. */
export interface ApiFailure {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

interface SendSuccessOptions<T> {
  data: T;
  message?: string;
  status?: number;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(
  res: Response,
  { data, message = 'OK', status = 200, meta }: SendSuccessOptions<T>,
) {
  const body: ApiSuccess<T> = { success: true, message, data, ...(meta ? { meta } : {}) };
  return res.status(status).json(body);
}
