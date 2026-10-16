import { z } from 'zod';
import { mobile } from '../auth/auth.schemas.js';

/**
 * Purposes anyone may ask a code for, with no sign-in. Changing a mobile and
 * resetting a password have their own endpoints, with their own checks.
 */
export const PUBLIC_PURPOSES = ['SIGNUP', 'GUEST_BOOKING'] as const;

const purpose = z.enum(PUBLIC_PURPOSES, 'Purpose must be SIGNUP or GUEST_BOOKING');

export const code = z
  .string('Enter the 6-digit code')
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code from the message');

export const sendCodeSchema = z.strictObject({ purpose, mobile }, 'Send purpose and mobile');
export const verifyCodeSchema = z.strictObject(
  { purpose, mobile, code },
  'Send purpose, mobile and code',
);

export type SendCodeInput = z.infer<typeof sendCodeSchema>;
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
