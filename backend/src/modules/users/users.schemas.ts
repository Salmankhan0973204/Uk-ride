import { z } from 'zod';
import { GENDERS, mobile, name, newPassword } from '../auth/auth.schemas.js';

/**
 * A partial update: send only what you want to change.
 *
 * Every field is optional, and the rules for each are the ones used at
 * registration, imported so they cannot drift apart.
 *
 * `strictObject` refuses any field that is not listed. Without it, unknown
 * fields are silently dropped; with it, a client that sends "email" or
 * "passwordHash" is told plainly that those cannot be changed here.
 */
export const updateProfileSchema = z
  .strictObject(
    {
      firstName: name('First name').optional(),
      lastName: name('Last name').optional(),
      mobile: mobile.optional(),
      // null clears it: "I would rather not say any more".
      gender: z.enum(GENDERS, 'Choose one of the listed options').nullable().optional(),
    },
    'Only firstName, lastName, mobile and gender can be changed here',
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
