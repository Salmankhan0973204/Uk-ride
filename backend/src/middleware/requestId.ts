import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

const HEADER = 'x-request-id';
const MAX_LENGTH = 100;
const SAFE_ID = /^[\w.-]+$/;

/**
 * Gives every request an id and echoes it in the response header.
 * A caller-supplied id is reused only when it looks safe to log.
 */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.get(HEADER)?.trim();
  const id =
    incoming && incoming.length <= MAX_LENGTH && SAFE_ID.test(incoming) ? incoming : randomUUID();

  res.locals.requestId = id;
  res.setHeader(HEADER, id);
  next();
};
