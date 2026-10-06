import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/response.js';
import type { RegisterInput } from './auth.schemas.js';
import { registerUser } from './auth.service.js';

/** Creates an account. The body was already checked by the validate middleware. */
export const register: RequestHandler = async (req, res) => {
  const user = await registerUser(req.body as RegisterInput);

  sendSuccess(res, { status: 201, message: 'Account created', data: { user } });
};
