import nodemailer from 'nodemailer';
import { env } from './env.js';

/**
 * Sends email over SMTP.
 *
 * In development the SMTP server is Mailpit, from docker-compose.yml: it
 * accepts every message and delivers none. Read them at http://localhost:8025.
 * Pointing SMTP_HOST and SMTP_PORT at a real provider is all it takes to send
 * real mail.
 */
const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  // Mailpit speaks plain SMTP. A real provider on port 465 uses TLS from the start.
  secure: env.SMTP_PORT === 465,
  // Give up quickly: nobody should wait on a mail server that is not there.
  connectionTimeout: 5_000,
});

export interface Email {
  to: string;
  subject: string;
  /** Plain text. Always sent, so the message reads in any mail client. */
  text: string;
  html: string;
}

export async function sendEmail(email: Email) {
  await transport.sendMail({ from: env.MAIL_FROM, ...email });
}
