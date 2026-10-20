import { z } from 'zod';
import { GENDERS, mobile, name, newPassword, otpCode } from '../auth/auth.schemas.js';

/**
 * A partial update: send only what you want to change.
 *
 * Every field is optional, and the rules for each are the ones used at
 * registration, imported so they cannot drift apart.
 *
 * `strictObject` refuses any field that is not listed. Without it, unknown
 * fields are silently dropped; with it, a client that sends "email",
 * "passwordHash" or "mobile" is told plainly that those cannot be changed
 * here. The mobile has its own endpoints, which prove the new number with a
 * code (step 2.7).
 */
export const updateProfileSchema = z
  .strictObject(
    {
      firstName: name('First name').optional(),
      lastName: name('Last name').optional(),
      // null clears it: "I would rather not say any more".
      gender: z.enum(GENDERS, 'Choose one of the listed options').nullable().optional(),
    },
    'Only firstName, lastName and gender can be changed here. The mobile is changed with a code',
  )
  .refine((changes) => Object.keys(changes).length > 0, 'Nothing to update');

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.strictObject(
  {
    // Checked against the stored hash, so only "not empty" is asked here.
    currentPassword: z
      .string('Current password is required')
      .min(1, 'Current password is required'),
    // The same rule as at registration and at reset.
    newPassword,
  },
  'Send currentPassword and newPassword only',
);

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Changing the mobile, step 1: the new number, which gets a code by text. */
export const mobileCodeSchema = z.strictObject({ mobile }, 'Send the new mobile only');
export type MobileCodeInput = z.infer<typeof mobileCodeSchema>;

/** Changing the mobile, step 2: the same number and the code it received. */
export const changeMobileSchema = z.strictObject(
  { mobile, code: otpCode },
  'Send the new mobile and the code',
);
export type ChangeMobileInput = z.infer<typeof changeMobileSchema>;
