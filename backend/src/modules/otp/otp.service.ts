import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { ensureRedis, redis } from '../../config/redis.js';
import type { OtpChannel, OtpPurpose } from '../../generated/prisma/client.js';
import { AppError } from '../../shared/AppError.js';
import { deliverCode } from './otp.sender.js';

/**
 * One-time codes: six digits sent by SMS or email, as on ukride.uk.
 *
 *   send    a new code replaces any earlier one for the same purpose and
 *           target. It lasts 10 minutes. Another can be sent after 60 s,
 *           and at most 5 an hour to one phone or email (counted in Redis,
 *           so every API process shares the count).
 *   verify  5 wrong tries end the code. The right one is used up and
 *           exchanged for a ticket: a signed note, valid 15 minutes and
 *           usable once, that says "this person proved they hold this
 *           number for this purpose". Register, guest booking, phone change
 *           and password reset each ask for a ticket instead of a code.
 *
 * Codes are stored as a keyed hash (HMAC with the server secret). Six digits
 * are only a million possibilities, so a plain hash of a leaked table could
 * be reversed in a second; without the secret it cannot.
 */

export const CODE_TTL_SECONDS = 10 * 60;
export const RESEND_AFTER_SECONDS = 60;
const MAX_TRIES = 5;
const MAX_SENDS_PER_HOUR = 5;
const TICKET_TTL_SECONDS = 15 * 60;
const TICKET_AUDIENCE = 'ukride-otp';

const hashCode = (target: string, code: string) =>
  createHmac('sha256', env.JWT_ACCESS_SECRET).update(`${target}:${code}`).digest('hex');

const sameHash = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** "+447400123456" → "+44 •••• ••3456"; "sara@example.com" → "s•••@example.com". */
export function maskTarget(target: string) {
  if (target.includes('@')) {
    const [local = '', domain = ''] = target.split('@');
    return `${local.charAt(0)}•••@${domain}`;
  }
  return `${target.slice(0, 3)} •••• ••${target.slice(-4)}`;
}

/**
 * Counts sends to one target in Redis. If Redis is down the code is still
 * sent: the 60-second gap checked in the database keeps protecting, and the
 * problem is logged rather than blocking every sign-up.
 */
async function countSend(purpose: OtpPurpose, target: string) {
  const key = `otp:sends:${purpose}:${target}`;
  try {
    await ensureRedis();
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60 * 60);
    return count;
  } catch (err) {
    logger.warn({ err }, 'Redis unavailable: per-number code limit skipped');
    return 0;
  }
}

export async function sendOtp(purpose: OtpPurpose, channel: OtpChannel, target: string) {
  const latest = await prisma.otpCode.findFirst({
    where: { purpose, target },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });
  if (latest) {
    const waited = (Date.now() - latest.createdAt.getTime()) / 1000;
    if (waited < RESEND_AFTER_SECONDS) {
      const wait = Math.ceil(RESEND_AFTER_SECONDS - waited);
      throw new AppError(
        429,
        'RATE_LIMITED',
        `Wait ${wait} seconds before asking for a new code.`,
        {
          retryAfterSeconds: wait,
        },
      );
    }
  }

  if ((await countSend(purpose, target)) > MAX_SENDS_PER_HOUR) {
    throw new AppError(
      429,
      'RATE_LIMITED',
      'Too many codes were sent to this address in the last hour. Try again later.',
    );
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');

  // The new code replaces any earlier one: only the latest works.
  await prisma.$transaction([
    prisma.otpCode.updateMany({
      where: { purpose, target, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.otpCode.create({
      data: {
        purpose,
        channel,
        target,
        codeHash: hashCode(target, code),
        expiresAt: new Date(Date.now() + CODE_TTL_SECONDS * 1000),
      },
    }),
  ]);

  try {
    await deliverCode(channel, target, code, purpose);
  } catch (err) {
    logger.error({ err }, 'Could not deliver a one-time code');
    throw new AppError(503, 'SERVICE_UNAVAILABLE', 'We could not send the code. Try again.');
  }

  return {
    sentTo: maskTarget(target),
    channel,
    expiresInSeconds: CODE_TTL_SECONDS,
    resendAfterSeconds: RESEND_AFTER_SECONDS,
  };
}

const codeProblem = (message: string) => AppError.validation({ code: [message] });

/**
 * Checks a code and uses it up, returning the code's id. A wrong, expired or
 * used code throws a 400 on `code` saying which. For a step that acts at once (changing
 * a signed-in user's mobile); a step that hands over to another request uses
 * verifyOtp() below and gets a ticket.
 */
export async function consumeOtp(purpose: OtpPurpose, target: string, code: string) {
  const otp = await prisma.otpCode.findFirst({
    where: { purpose, target, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp || otp.expiresAt <= new Date()) {
    throw codeProblem('This code has expired or was replaced. Ask for a new one');
  }
  if (otp.attempts >= MAX_TRIES) {
    throw codeProblem('Too many wrong tries. Ask for a new code');
  }

  if (!sameHash(otp.codeHash, hashCode(target, code))) {
    // Counted with a condition, so two guesses at once cannot both get the last try.
    await prisma.otpCode.updateMany({
      where: { id: otp.id, attempts: { lt: MAX_TRIES } },
      data: { attempts: { increment: 1 } },
    });
    const left = MAX_TRIES - otp.attempts - 1;
    throw codeProblem(
      left > 0
        ? `That code is not right. ${left} ${left === 1 ? 'try' : 'tries'} left`
        : 'Too many wrong tries. Ask for a new code',
    );
  }

  const used = await prisma.otpCode.updateMany({
    where: { id: otp.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (used.count !== 1) throw codeProblem('This code was just used. Ask for a new one');

  return otp.id;
}

/** Checks a code. The right one becomes a ticket; see the top of this file. */
export async function verifyOtp(purpose: OtpPurpose, target: string, code: string) {
  const otpId = await consumeOtp(purpose, target, code);

  const ticket = jwt.sign({ purpose }, env.JWT_ACCESS_SECRET, {
    subject: target,
    audience: TICKET_AUDIENCE,
    jwtid: otpId,
    expiresIn: TICKET_TTL_SECONDS,
    algorithm: 'HS256',
  });

  return { ticket, expiresInSeconds: TICKET_TTL_SECONDS };
}

const badTicket = () =>
  AppError.validation(
    { otpTicket: ['Your code check has expired. Ask for a new code'] },
    'Your code check has expired. Ask for a new code',
  );

/**
 * Accepts a ticket once, for one purpose and one target, and returns
 * nothing. Spending it is recorded on the code it came from, so the same
 * ticket cannot be used twice.
 */
export async function spendTicket(ticket: string, purpose: OtpPurpose, target: string) {
  let payload: jwt.JwtPayload;
  try {
    const decoded = jwt.verify(ticket, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      audience: TICKET_AUDIENCE,
      subject: target,
    });
    if (typeof decoded === 'string') throw new Error('bad ticket');
    payload = decoded;
  } catch {
    throw badTicket();
  }
  if (payload.purpose !== purpose || !payload.jti) throw badTicket();

  const spent = await prisma.otpCode.updateMany({
    where: { id: payload.jti, ticketUsedAt: null },
    data: { ticketUsedAt: new Date() },
  });
  if (spent.count !== 1) throw badTicket();
}

/** Deletes codes that ended more than a day ago. Run by the clean-up job. */
export async function deleteOldOtpCodes() {
  const { count } = await prisma.otpCode.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  return count;
}
