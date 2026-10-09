import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
import { z } from 'zod';

export const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;

// Letters from any alphabet, with spaces, hyphens, apostrophes and full stops
// inside: "Anne-Marie", "O'Neil", "José", "محمد". No digits or symbols.
// An empty value passes here so it gets one message, "is required", not two.
const NAME_PATTERN = /^([\p{L}\p{M}][\p{L}\p{M}' .-]*)?$/u;

export function name(label: string) {
  return z
    .string(`${label} is required`)
    .trim()
    .min(1, `${label} is required`)
    .max(50, `${label} must be at most 50 characters`)
    .regex(NAME_PATTERN, `${label} can only contain letters, spaces, hyphens and apostrophes`);
}

// Kinds of number that can be a mobile. Some countries, the United States
// among them, do not tell mobiles and landlines apart by their digits.
const MOBILE_TYPES = new Set(['MOBILE', 'FIXED_LINE_OR_MOBILE', 'PERSONAL_NUMBER']);

/**
 * A mobile number from any country, returned in one international form
 * (E.164): "+447400123456".
 *
 * Spaces, dashes and brackets are removed and a leading "00" becomes "+", so
 * "0044 (7400) 123-456" and "+447400123456" are the same number. The digits
 * are then checked against the numbering plan of the number's own country:
 * the right length, a range that is really allocated, and a mobile rather
 * than a landline. That proves the number could exist. Only sending a code
 * to it could prove that it does, and that this person holds it.
 */
export const mobile = z.string('Mobile number is required').transform((value, ctx) => {
  const fail = (message: string) => {
    ctx.issues.push({ code: 'custom', message, input: value });
    return z.NEVER;
  };

  const cleaned = value.replace(/[\s().-]/g, '').replace(/^00/, '+');
  if (!cleaned) return fail('Mobile number is required');
  if (!cleaned.startsWith('+')) {
    return fail('Enter a mobile number with its country code, like +44 7400 123456');
  }

  const phone = parsePhoneNumberFromString(cleaned);
  if (!phone?.isValid()) {
    return fail('That is not a valid number for its country. Check the digits');
  }
  if (!MOBILE_TYPES.has(phone.getType() ?? '')) {
    return fail('That looks like a landline. Enter a mobile number');
  }

  return phone.number as string;
});

// bcrypt ignores everything after 72 bytes, so longer passwords are refused
// instead of being silently shortened. Used wherever a password is chosen.
export const newPassword = z
  .string('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

// The cleaned form of an email: trimmed and lower-cased, so
// "Sara@Example.com " and "sara@example.com" are the same account.
const email = z
  .string('Email is required')
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address'));

// The token from a link we emailed. Its content is checked against the database.
const linkToken = z.string('The link is incomplete').min(20, 'The link is incomplete').max(200);

export const registerSchema = z.object({
  firstName: name('First name'),
  lastName: name('Last name'),
  email,
  mobile,
  // Optional: leaving it out is a valid answer.
  gender: z.enum(GENDERS, 'Choose one of the listed options').optional(),
  password: newPassword,
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  // Cleaned the same way as at registration, so "Sara@Example.com " signs in.
  email,
  // Only "not empty" is checked here. The length rules belong to choosing a
  // password; repeating them at login would tell a guesser what the rules are.
  password: z.string('Password is required').min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({ token: linkToken });
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({ token: linkToken, password: newPassword });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
