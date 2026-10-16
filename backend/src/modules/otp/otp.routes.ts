import { Router } from 'express';
import { otpSendLimiter, otpVerifyLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { sendCode, verifyCode } from './otp.controller.js';
import { sendCodeSchema, verifyCodeSchema } from './otp.schemas.js';

/** Mounted at /api/v1/auth/otp. */
export const otpRouter = Router();

otpRouter.post('/send', otpSendLimiter, validate(sendCodeSchema), sendCode);
otpRouter.post('/verify', otpVerifyLimiter, validate(verifyCodeSchema), verifyCode);
