import type { RequestHandler } from 'express';
import { AppError } from '../shared/AppError.js';

/** Catches any request that matched no route. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.path} not found`));
};
