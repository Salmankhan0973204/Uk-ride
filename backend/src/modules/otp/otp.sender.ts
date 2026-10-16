import { isProd } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { sendEmail } from '../../config/mailer.js';
import type { OtpChannel } from '../../generated/prisma/client.js';

/**
 * Delivers a one-time code.
 *
 * Email goes out through the normal mail server (Mailpit in development).
 *
 * SMS costs money per message, so for now there is no SMS provider. The
 * development driver delivers the "text message" to Mailpit as an email
 * addressed to the phone number, and logs it, so the whole flow can be
 * followed at http://localhost:8025. A real provider (Twilio, Vonage ...)
 * replaces `sendSms` and nothing else changes.
 */
export async function deliverCode(
  channel: OtpChannel,
  target: string,
  code: string,
  purpose: string,
) {
  const text = `Your UkRide code is ${code}. It expires in 10 minutes. Do not share it with anyone.`;

  if (channel === 'EMAIL') {
    await sendEmail({
      to: target,
      subject: `Your UkRide code: ${code}`,
      text: `${text}\n\nIf you did not ask for this code, you can ignore this email.`,
      html: `<p style="font-family:Arial,sans-serif;font-size:16px">Your UkRide code is <strong style="font-size:22px;letter-spacing:3px">${code}</strong>.</p><p style="font-family:Arial,sans-serif;font-size:14px;color:#555">It expires in 10 minutes. Do not share it with anyone. If you did not ask for this code, you can ignore this email.</p>`,
    });
    return;
  }

  await sendSms(target, text, purpose);
}

/** Development SMS: an email to Mailpit standing in for a text message. */
async function sendSms(phone: string, text: string, purpose: string) {
  if (isProd) {
    // No SMS provider is set up yet; a production build must not pretend.
    throw new Error('No SMS provider is configured');
  }

  logger.info({ to: phone, purpose }, `Development SMS: ${text}`);
  await sendEmail({
    to: `${phone.replace('+', '')}@sms.ukride.local`,
    subject: `SMS to ${phone}`,
    text,
    html: `<pre style="font-family:monospace;font-size:15px">${text}</pre>`,
  });
}
