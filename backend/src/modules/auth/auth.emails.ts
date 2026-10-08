import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/db.js';
import { env, isTest } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { sendEmail } from '../../config/mailer.js';
import type { EmailTokenPurpose } from '../../generated/prisma/client.js';
import { AppError } from '../../shared/AppError.js';

/**
 * Links sent by email: one to confirm an email address, one to choose a new
 * password.
 *
 * Both work the same way as a refresh token. The link carries a long random
 * token; the database keeps only its hash, an expiry and whether it was used.
 * Whoever opens the link proves they can read that mailbox.
 */

const MINUTE_MS = 60_000;
const VERIFY_TTL_MINUTES = 24 * 60;
const RESET_TTL_MINUTES = 60;
const HASH_COST = isTest ? 4 : 12;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const badLink = () =>
  AppError.badRequest('This link is not valid or has expired. Ask for a new one.');

interface Recipient {
  id: string;
  email: string;
  firstName: string;
}

/** Makes a new link token for a user. Any earlier unused one for the same purpose is removed. */
async function createEmailToken(userId: string, purpose: EmailTokenPurpose, ttlMinutes: number) {
  const token = randomBytes(32).toString('base64url');

  await prisma.emailToken.deleteMany({ where: { userId, purpose, usedAt: null } });
  await prisma.emailToken.create({
    data: {
      userId,
      purpose,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + ttlMinutes * MINUTE_MS),
    },
  });

  return token;
}

/** Looks a token up and checks it is the right kind, unused and not expired. */
async function findUsableToken(token: string, purpose: EmailTokenPurpose) {
  const stored = await prisma.emailToken.findUnique({ where: { tokenHash: hashToken(token) } });

  if (!stored || stored.purpose !== purpose || stored.usedAt || stored.expiresAt <= new Date()) {
    throw badLink();
  }
  return stored;
}

/** One layout for both emails: a sentence, a button, the same link as text. */
function compose(firstName: string, lines: string[], action: string, url: string, note: string) {
  const text = [`Hello ${firstName},`, '', ...lines, '', `${action}:`, url, '', note, '', 'UkRide'];
  const html = `<!doctype html>
<html lang="en-GB">
  <body style="margin:0;padding:32px 16px;background:#f4f4f8;font-family:Arial,Helvetica,sans-serif;color:#1a1a2e">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
      <p style="margin:0 0 16px;font-size:16px">Hello ${escapeHtml(firstName)},</p>
      ${lines.map((line) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.5">${escapeHtml(line)}</p>`).join('\n      ')}
      <p style="margin:24px 0">
        <a href="${url}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:10px">${escapeHtml(action)}</a>
      </p>
      <p style="margin:0 0 8px;font-size:14px;color:#55556a">Or paste this link into your browser:</p>
      <p style="margin:0 0 24px;font-size:14px;word-break:break-all"><a href="${url}" style="color:#4f46e5">${url}</a></p>
      <p style="margin:0;font-size:14px;line-height:1.5;color:#55556a">${escapeHtml(note)}</p>
    </div>
  </body>
</html>`;

  return { text: text.join('\n'), html };
}

/** A name typed by a user goes into HTML, so its special characters are neutralised. */
function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export async function sendVerificationEmail(user: Recipient) {
  const token = await createEmailToken(user.id, 'VERIFY_EMAIL', VERIFY_TTL_MINUTES);
  const url = `${env.WEB_APP_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: 'Confirm your email address for UkRide',
    ...compose(
      user.firstName,
      ['Thanks for creating a UkRide account. Please confirm that this email address is yours.'],
      'Confirm my email address',
      url,
      'The link works once and expires in 24 hours. If you did not create this account, you can ignore this email.',
    ),
  });
}

async function sendPasswordResetEmail(user: Recipient) {
  const token = await createEmailToken(user.id, 'RESET_PASSWORD', RESET_TTL_MINUTES);
  const url = `${env.WEB_APP_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: 'Choose a new UkRide password',
    ...compose(
      user.firstName,
      ['We received a request to reset the password for your UkRide account.'],
      'Choose a new password',
      url,
      'The link works once and expires in 1 hour. If you did not ask for this, ignore this email: your password stays as it is.',
    ),
  });
}

/**
 * Sends an email without making the caller wait for it or fail with it.
 * Registration must succeed even when the mail server is down, and "forgot
 * password" must take the same time whether or not the account exists.
 */
export function sendInBackground(send: Promise<void>, what: string) {
  void send.catch((err: unknown) => logger.error({ err }, `Could not send the ${what} email`));
}

/** Confirms an email address from the link token. */
export async function verifyEmail(token: string) {
  const stored = await findUsableToken(token, 'VERIFY_EMAIL');
  const now = new Date();

  // Both changes happen, or neither does.
  await prisma.$transaction([
    prisma.emailToken.update({ where: { id: stored.id }, data: { usedAt: now } }),
    prisma.user.update({ where: { id: stored.userId }, data: { emailVerifiedAt: now } }),
  ]);
}

/** Sends the confirmation link again to a signed-in user. Returns false if already confirmed. */
export async function resendVerification(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, emailVerifiedAt: true },
  });
  if (!user) throw AppError.unauthenticated('Your session is not valid. Sign in again.');
  if (user.emailVerifiedAt) return false;

  await sendVerificationEmail(user);
  return true;
}

/**
 * Starts a password reset. It answers the same way whether or not the email
 * has an account, and does not wait for the email, so neither the answer nor
 * its timing tells anyone which addresses are registered.
 */
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true },
  });

  if (user) sendInBackground(sendPasswordResetEmail(user), 'password reset');
}

/** Sets a new password from the link token and signs the user out everywhere. */
export async function resetPassword(token: string, password: string) {
  const stored = await findUsableToken(token, 'RESET_PASSWORD');
  const passwordHash = await bcrypt.hash(password, HASH_COST);
  const now = new Date();

  await prisma.$transaction([
    prisma.emailToken.update({ where: { id: stored.id }, data: { usedAt: now } }),
    prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } }),
    // Whoever knew the old password, on any device, is signed out.
    prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: now },
    }),
  ]);

  // Opening the reset link also proves the mailbox is theirs. Kept outside the
  // transaction so it only fills an empty value and never overwrites a date.
  await prisma.user.updateMany({
    where: { id: stored.userId, emailVerifiedAt: null },
    data: { emailVerifiedAt: now },
  });
}
