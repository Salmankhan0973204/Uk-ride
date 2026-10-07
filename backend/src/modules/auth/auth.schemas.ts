import { z } from 'zod';

export const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;

// Letters from any alphabet, with spaces, hyphens, apostrophes and full stops
// inside: "Anne-Marie", "O'Neil", "José", "محمد". No digits or symbols.
// An empty value passes here so it gets one message, "is required", not two.
const NAME_PATTERN = /^([\p{L}\p{M}][\p{L}\p{M}' .-]*)?$/u;

function name(label: string) {
  return z
    .string(`${label} is required`)
    .trim()
    .min(1, `${label} is required`)
    .max(50, `${label} must be at most 50 characters`)
    .regex(NAME_PATTERN, `${label} can only contain letters, spaces, hyphens and apostrophes`);
}

export const registerSchema = z.object({
  firstName: name('First name'),
  lastName: name('Last name'),
  // Trimmed and lower-cased first, so "Sara@Example.com " and
  // "sara@example.com" are the same account.
  email: z
    .string('Email is required')
    .trim()
    .toLowerCase()
    .pipe(z.email('Enter a valid email address')),
  // Any country, stored in one international form (E.164): "+" then the
  // country code and number, 8 to 15 digits. Spaces, dashes and brackets are
  // removed and a leading "00" becomes "+", so "0044 (7400) 123-456" and
  // "+447400123456" are the same number.
  mobile: z
    .string('Mobile number is required')
    .transform((value) => value.replace(/[\s().-]/g, '').replace(/^00/, '+'))
    .pipe(
      z
        .string()
        .min(1, 'Mobile number is required')
        .regex(
          /^\+[1-9]\d{7,14}$/,
          'Enter a mobile number with its country code, like +44 7400 123456',
        ),
    ),
  // Optional: leaving it out is a valid answer.
  gender: z.enum(GENDERS, 'Choose one of the listed options').optional(),
  // bcrypt ignores everything after 72 bytes, so longer passwords are refused
  // instead of being silently shortened.
  password: z
    .string('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
