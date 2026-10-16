import { prisma } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { hashPassword } from '../../shared/passwords.js';
import {
  CODE_TTL_SECONDS,
  RESEND_AFTER_SECONDS,
  maskTarget,
  sendOtp,
  spendTicket,
  verifyOtp,
} from '../otp/otp.service.js';
import { publicUser } from '../users/users.select.js';

/**
 * Forgot password, as on ukride.uk: a 6-digit code to the email address,
 * then a new password.
 *
 *   1. send    a RESET_PASSWORD code goes to the email, if it has an account
 *   2. verify  the right code is exchanged for a ticket (see otp.service.ts)
 *   3. reset   the ticket and a new password: the password changes, every
 *              session ends, and the person is signed in again
 *
 * Proving the mailbox replaces the old emailed link: the code is short, but it
 * dies after 5 wrong tries or 10 minutes, and the ticket works once.
 */

/**
 * Step 1. The answer is the same for every address, account or not, and the
 * code is sent in the background, so neither the words nor the time taken
 * tell anyone which emails are registered. For the same reason a refusal
 * (asked again within 60 s, or more than 5 an hour) is only logged; the
 * page shows its own 60-second wait before offering "Send a new code".
 */
export async function sendResetCode(email: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (user) {
    void sendOtp('RESET_PASSWORD', 'EMAIL', email).catch((err: unknown) =>
      logger.warn({ err }, 'Password reset code not sent'),
    );
  }

  return {
    sentTo: maskTarget(email),
    channel: 'EMAIL' as const,
    expiresInSeconds: CODE_TTL_SECONDS,
    resendAfterSeconds: RESEND_AFTER_SECONDS,
  };
}

/** Step 2. The right code becomes a RESET_PASSWORD ticket for this email. */
export function checkResetCode(email: string, code: string) {
  return verifyOtp('RESET_PASSWORD', email, code);
}

/**
 * Step 3. Spends the ticket, sets the new password and ends every session of
 * the account, on every device. Returns the user, to be signed in afresh.
 */
export async function resetPassword(email: string, otpTicket: string, password: string) {
  // The ticket names the email it was issued for, so it cannot be used for another.
  await spendTicket(otpTicket, 'RESET_PASSWORD', email);
  const passwordHash = await hashPassword(password);

  return prisma.$transaction(async (tx) => {
    // The code reached the mailbox, which proves the address. Only an empty
    // value is filled; an earlier date is kept.
    await tx.user.updateMany({
      where: { email, emailVerifiedAt: null },
      data: { emailVerifiedAt: new Date() },
    });
    const user = await tx.user.update({
      where: { email },
      data: { passwordHash },
      select: publicUser,
    });
    // Whoever knew the old password, on any device, is signed out.
    await tx.refreshToken.deleteMany({ where: { userId: user.id } });
    return user;
  });
}
