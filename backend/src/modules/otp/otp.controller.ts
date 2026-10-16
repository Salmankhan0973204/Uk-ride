import type { RequestHandler } from 'express';
import { prisma } from '../../config/db.js';
import { AppError } from '../../shared/AppError.js';
import { sendSuccess } from '../../shared/response.js';
import type { SendCodeInput, VerifyCodeInput } from './otp.schemas.js';
import { sendOtp, verifyOtp } from './otp.service.js';

/**
 * Sends a code to a mobile. For sign-up, a number that already has an
 * account is refused before any message goes out: the person should sign in,
 * and an SMS would be wasted.
 */
export const sendCode: RequestHandler = async (req, res) => {
  const { purpose, mobile } = req.body as SendCodeInput;

  if (purpose === 'SIGNUP') {
    const taken = await prisma.user.findUnique({ where: { mobile }, select: { id: true } });
    if (taken) {
      throw AppError.conflict('An account with this mobile number already exists', {
        field: 'mobile',
      });
    }
  }

  const sent = await sendOtp(purpose, 'SMS', mobile);
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, { message: `Code sent to ${sent.sentTo}`, data: sent });
};

/** Checks a code and answers with a ticket for the next step. */
export const verifyCode: RequestHandler = async (req, res) => {
  const { purpose, mobile, code } = req.body as VerifyCodeInput;
  const result = await verifyOtp(purpose, mobile, code);

  res.set('Cache-Control', 'no-store');
  sendSuccess(res, { message: 'Code accepted', data: result });
};
