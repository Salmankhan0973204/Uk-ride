import type { Email } from '../config/mailer.js';

/**
 * A mail sender for tests: nothing leaves the machine, and every message is
 * kept in `outbox` so a test can read it. Use it like this:
 *
 *   vi.mock('../../config/mailer.js', async () => ({
 *     sendEmail: (await import('../../test/fakeMailer.js')).sendEmail,
 *   }));
 */
export const outbox: Email[] = [];

export function sendEmail(email: Email) {
  outbox.push(email);
  return Promise.resolve();
}

/**
 * The application sends email in the background, after it has answered. This
 * waits until the outbox holds `count` messages and returns the latest.
 */
export async function waitForEmail(count = 1): Promise<Email> {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (outbox.length >= count) return outbox[count - 1]!;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Expected ${count} email(s), found ${outbox.length}`);
}

/** Gives background sends a moment, then reports how many messages there are. */
export async function settledOutboxSize() {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return outbox.length;
}

/** The token inside the link of an email. */
export function tokenFrom(email: Email) {
  const token = /[?&]token=([\w-]+)/.exec(email.text)?.[1];
  if (!token) throw new Error('The email has no link with a token');
  return token;
}
