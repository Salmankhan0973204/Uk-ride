import type { RequestHandler } from 'express';
import { sendSuccess } from '../../shared/response.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';
import { loginUser, registerUser } from './auth.service.js';

/** Creates an account. The body was already checked by the validate middleware. */
export const register: RequestHandler = async (req, res) => {
  const user = await registerUser(req.body as RegisterInput);

  sendSuccess(res, { status: 201, message: 'Account created', data: { user } });
};

/**
 * Signs a user in. Answers with the user and a short-lived access token that
 * the client sends back in the Authorization header as "Bearer <token>".
 */
export const login: RequestHandler = async (req, res) => {
  const result = await loginUser(req.body as LoginInput);

  // A login response holds a credential, so nothing along the way may store it.
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, { message: 'Signed in', data: { ...result, tokenType: 'Bearer' } });
};
