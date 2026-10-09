import type { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../shared/AppError.js';

/**
 * Checks the request body against a Zod schema before the controller runs.
 * On success the body is replaced by the parsed data, so the controller gets
 * trimmed, typed values. On failure the request ends with 400.
 *
 * Problems with one field go in `details`, one list of messages per field.
 * A problem with the body as a whole (an unknown field, nothing to update)
 * has no field to sit under, so it becomes the error message itself.
 */
export function validate(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    // A request without a body is treated as an empty object, so the answer
    // names the missing fields instead of saying "expected object".
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      const { fieldErrors, formErrors } = z.flattenError(result.error);
      throw AppError.validation(fieldErrors, formErrors[0]);
    }

    req.body = result.data;
    next();
  };
}
