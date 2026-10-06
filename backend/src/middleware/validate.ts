import type { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../shared/AppError.js';

/**
 * Checks the request body against a Zod schema before the controller runs.
 * On success the body is replaced by the parsed data, so the controller gets
 * trimmed, typed values. On failure the request ends with 400 and one list of
 * messages per field.
 */
export function validate(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    // A request without a body is treated as an empty object, so the answer
    // names the missing fields instead of saying "expected object".
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      throw AppError.validation(z.flattenError(result.error).fieldErrors);
    }

    req.body = result.data;
    next();
  };
}
