import { z } from 'zod';

export const registerSchema = z.object({
  // Trimmed and lower-cased first, so "Sara@Example.com " and
  // "sara@example.com" are the same account.
  email: z
    .string('Email is required')
    .trim()
    .toLowerCase()
    .pipe(z.email('Enter a valid email address')),
  // bcrypt ignores everything after 72 bytes, so longer passwords are refused
  // instead of being silently shortened.
  password: z
    .string('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
