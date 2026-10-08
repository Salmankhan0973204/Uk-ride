import { createHash } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../app.js';
import { outbox, settledOutboxSize, tokenFrom, waitForEmail } from '../../test/fakeMailer.js';
import { prisma, resetDatabase } from '../../test/testDatabase.js';

// Real database, but no real email: messages land in an in-memory outbox.
vi.mock('../../config/mailer.js', async () => ({
  sendEmail: (await import('../../test/fakeMailer.js')).sendEmail,
}));

const COOKIE = 'ukride_refresh';
const sara = {
  firstName: 'Sara',
  lastName: 'Khan',
  email: 'sara@example.com',
  mobile: '+447400123456',
  password: 'secret-pass-1',
};
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

const post = (path: string, body?: object) => {
  const req = request(app).post(`/api/v1/auth${path}`);
  return body ? req.send(body) : req;
};
const register = () => post('/register', sara);
const login = (password = sara.password) => post('/login', { email: sara.email, password });
const me = (accessToken: string) =>
  request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`);
const resend = (accessToken: string) =>
  post('/resend-verification').set('Authorization', `Bearer ${accessToken}`);
const cookieOf = (res: request.Response) =>
  ([] as string[])
    .concat(res.headers['set-cookie'] ?? [])
    .find((line) => line.startsWith(`${COOKIE}=`))
    ?.split(';')[0]
    ?.slice(COOKIE.length + 1) ?? '';

const BAD_LINK = 'This link is not valid or has expired. Ask for a new one.';

/** Registers Sara and returns the token from her confirmation email. */
async function registerAndGetToken() {
  await register();
  return tokenFrom(await waitForEmail());
}

/** Asks for a reset for Sara and returns the token from that email. */
async function requestResetToken() {
  const before = outbox.length;
  await post('/forgot-password', { email: sara.email });
  return tokenFrom(await waitForEmail(before + 1));
}

beforeEach(async () => {
  await resetDatabase();
  outbox.length = 0;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('confirming an email address', () => {
  it('emails a link on registration and stores only a hash of its token', async () => {
    await register();
    const email = await waitForEmail();
    const token = tokenFrom(email);

    expect(email.to).toBe(sara.email);
    expect(email.subject).toBe('Confirm your email address for UkRide');
    expect(email.text).toContain(`http://localhost:3000/verify-email?token=${token}`);
    expect(email.html).toContain(`verify-email?token=${token}`);
    expect(email.text).toContain('Hello Sara,');

    const row = await prisma.emailToken.findFirstOrThrow();
    expect(row.purpose).toBe('VERIFY_EMAIL');
    expect(row.tokenHash).toBe(sha256(token));
    expect(row.tokenHash).not.toBe(token);
  });

  it('starts unconfirmed, and the link confirms it', async () => {
    const token = await registerAndGetToken();
    const access = (await login()).body.data.accessToken as string;
    expect((await me(access)).body.data.user.emailVerifiedAt).toBeNull();

    const res = await post('/verify-email', { token });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Email address confirmed');
    expect((await me(access)).body.data.user.emailVerifiedAt).toEqual(expect.any(String));
  });

  it('lets a link work once only', async () => {
    const token = await registerAndGetToken();
    await post('/verify-email', { token });

    const again = await post('/verify-email', { token });

    expect(again.status).toBe(400);
    expect(again.body.error.message).toBe(BAD_LINK);
  });

  it('refuses a made-up token, an expired link and a link of the other kind', async () => {
    const token = await registerAndGetToken();

    const madeUp = await post('/verify-email', { token: 'x'.repeat(43) });
    expect(madeUp.status).toBe(400);
    expect(madeUp.body.error.message).toBe(BAD_LINK);

    // A reset link must not confirm an email.
    const resetToken = await requestResetToken();
    expect((await post('/verify-email', { token: resetToken })).status).toBe(400);

    await prisma.emailToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1_000) } });
    const expired = await post('/verify-email', { token });
    expect(expired.status).toBe(400);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: sara.email } });
    expect(user.emailVerifiedAt).toBeNull();
  });

  it('answers 400 for a token that is too short to be one', async () => {
    const res = await post('/verify-email', { token: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('sends a fresh link on request, and the earlier link stops working', async () => {
    const first = await registerAndGetToken();
    const access = (await login()).body.data.accessToken as string;

    const res = await resend(access);
    const second = tokenFrom(await waitForEmail(2));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ sent: true });
    expect(second).not.toBe(first);
    expect((await post('/verify-email', { token: first })).status).toBe(400);
    expect((await post('/verify-email', { token: second })).status).toBe(200);
  });

  it('sends nothing more once the address is confirmed', async () => {
    const token = await registerAndGetToken();
    await post('/verify-email', { token });
    const access = (await login()).body.data.accessToken as string;

    const res = await resend(access);

    expect(res.body.data).toEqual({ sent: false });
    expect(await settledOutboxSize()).toBe(1);
  });

  it('needs a signed-in user to resend', async () => {
    const res = await post('/resend-verification');

    expect(res.status).toBe(401);
  });
});

describe('resetting a forgotten password', () => {
  const SAME_ANSWER = 'If that email has an account, we have sent a link to reset the password';

  it('emails a reset link to an address that has an account', async () => {
    await registerAndGetToken();

    const res = await post('/forgot-password', { email: '  SARA@example.com ' });
    const email = await waitForEmail(2);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(SAME_ANSWER);
    expect(email.to).toBe(sara.email);
    expect(email.subject).toBe('Choose a new UkRide password');
    expect(email.text).toContain(`http://localhost:3000/reset-password?token=${tokenFrom(email)}`);
  });

  it('gives an unknown address the same answer and sends nothing', async () => {
    await registerAndGetToken();
    const known = await post('/forgot-password', { email: sara.email });
    await waitForEmail(2);

    const unknown = await post('/forgot-password', { email: 'nobody@example.com' });

    expect(unknown.status).toBe(200);
    expect(unknown.body).toEqual(known.body);
    expect(await settledOutboxSize()).toBe(2);
  });

  it('sets the new password: the old one stops working and the new one signs in', async () => {
    await registerAndGetToken();
    const token = await requestResetToken();

    const res = await post('/reset-password', { token, password: 'a-brand-new-pass' });

    expect(res.status).toBe(200);
    expect((await login(sara.password)).status).toBe(401);
    expect((await login('a-brand-new-pass')).status).toBe(200);
  });

  it('signs the user out everywhere', async () => {
    await registerAndGetToken();
    const phone = await login();
    const laptop = await login();
    const token = await requestResetToken();

    await post('/reset-password', { token, password: 'a-brand-new-pass' });

    expect((await me(phone.body.data.accessToken)).status).toBe(401);
    expect((await me(laptop.body.data.accessToken)).status).toBe(401);
    const refresh = await post('/refresh').set('Cookie', `${COOKIE}=${cookieOf(laptop)}`);
    expect(refresh.status).toBe(401);
    expect(await prisma.refreshToken.count({ where: { revokedAt: null } })).toBe(0);
  });

  it('lets a reset link work once only', async () => {
    await registerAndGetToken();
    const token = await requestResetToken();
    await post('/reset-password', { token, password: 'a-brand-new-pass' });

    const again = await post('/reset-password', { token, password: 'another-password' });

    expect(again.status).toBe(400);
    expect(again.body.error.message).toBe(BAD_LINK);
    expect((await login('a-brand-new-pass')).status).toBe(200);
  });

  it('refuses a weak password and leaves the link usable', async () => {
    await registerAndGetToken();
    const token = await requestResetToken();

    const weak = await post('/reset-password', { token, password: 'short' });

    expect(weak.status).toBe(400);
    expect(weak.body.error.details).toEqual({
      password: ['Password must be at least 8 characters'],
    });
    expect((await post('/reset-password', { token, password: 'a-brand-new-pass' })).status).toBe(
      200,
    );
  });

  it('refuses a confirmation link, an expired link and a made-up token', async () => {
    const verifyToken = await registerAndGetToken();
    const token = await requestResetToken();
    const body = (t: string) => ({ token: t, password: 'a-brand-new-pass' });

    expect((await post('/reset-password', body(verifyToken))).status).toBe(400);
    expect((await post('/reset-password', body('x'.repeat(43)))).status).toBe(400);
    await prisma.emailToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1_000) } });
    expect((await post('/reset-password', body(token))).status).toBe(400);

    // Nothing changed: the original password still works.
    expect((await login()).status).toBe(200);
  });

  it('keeps only the newest reset link alive', async () => {
    await registerAndGetToken();
    const first = await requestResetToken();
    const second = await requestResetToken();

    const withFirst = await post('/reset-password', { token: first, password: 'a-brand-new-pass' });

    expect(withFirst.status).toBe(400);
    expect(
      (await post('/reset-password', { token: second, password: 'a-brand-new-pass' })).status,
    ).toBe(200);
  });

  it('also confirms the email address, since the link proved the mailbox', async () => {
    await registerAndGetToken();
    const token = await requestResetToken();

    await post('/reset-password', { token, password: 'a-brand-new-pass' });

    const user = await prisma.user.findUniqueOrThrow({ where: { email: sara.email } });
    expect(user.emailVerifiedAt).not.toBeNull();
  });
});
