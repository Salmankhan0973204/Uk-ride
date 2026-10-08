import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../app.js';
import { runCleanup } from '../../jobs/cleanup.js';
import { prisma, resetDatabase } from '../../test/testDatabase.js';

/**
 * The auth module against a real PostgreSQL database: no fakes. These tests
 * prove what the unit tests can only assume, that the SQL, the unique indexes,
 * the foreign keys and Prisma's error codes behave the way the code expects.
 */

// Registration sends a confirmation email. These tests are not about email,
// so it goes to an in-memory outbox; auth.emails.itest.ts covers it.
vi.mock('../../config/mailer.js', async () => ({
  sendEmail: (await import('../../test/fakeMailer.js')).sendEmail,
}));

const COOKIE = 'ukride_refresh';
const sara = {
  firstName: 'Sara',
  lastName: 'Khan',
  email: 'sara@example.com',
  mobile: '+447400123456',
  gender: 'FEMALE',
  password: 'secret-pass-1',
};

const register = (body: object = sara) => request(app).post('/api/v1/auth/register').send(body);
const login = (email = sara.email, password = sara.password) =>
  request(app).post('/api/v1/auth/login').send({ email, password });
const withCookie = (path: string, token: string) =>
  request(app).post(path).set('Cookie', `${COOKIE}=${token}`);
const refresh = (token: string) => withCookie('/api/v1/auth/refresh', token);
const logout = (token: string) => withCookie('/api/v1/auth/logout', token);
const me = (accessToken: string) =>
  request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`);

function refreshToken(res: request.Response) {
  const lines = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  const line = lines.find((entry) => entry.startsWith(`${COOKIE}=`));
  return line?.split(';')[0]?.slice(COOKIE.length + 1) ?? '';
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('database', () => {
  it('is reachable, and readiness says so', async () => {
    const res = await request(app).get('/api/v1/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.data.checks.database.status).toBe('up');
  });
});

describe('register', () => {
  it('stores the user with a hashed password and cleaned values', async () => {
    const res = await register({
      ...sara,
      email: '  Sara@Example.COM ',
      mobile: '0044 (7400) 123-456',
    });

    expect(res.status).toBe(201);
    const row = await prisma.user.findUniqueOrThrow({ where: { email: 'sara@example.com' } });
    expect(row).toMatchObject({
      id: res.body.data.user.id,
      firstName: 'Sara',
      mobile: '+447400123456',
      gender: 'FEMALE',
    });
    expect(row.passwordHash).not.toBe(sara.password);
    expect(await bcrypt.compare(sara.password, row.passwordHash)).toBe(true);
  });

  it('stores gender as NULL when it is left out', async () => {
    const { gender: _gender, ...withoutGender } = sara;

    await register(withoutGender);

    const row = await prisma.user.findUniqueOrThrow({ where: { email: sara.email } });
    expect(row.gender).toBeNull();
  });

  it('refuses a second account with the same email, naming the field', async () => {
    await register();

    const res = await register({ ...sara, mobile: '+447400999000' });

    expect(res.status).toBe(409);
    expect(res.body.error.details).toEqual({ field: 'email' });
    expect(await prisma.user.count()).toBe(1);
  });

  it('refuses a second account with the same mobile, however it is typed', async () => {
    await register();

    const res = await register({
      ...sara,
      email: 'other@example.com',
      mobile: '+44 7400 123 456',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.details).toEqual({ field: 'mobile' });
    expect(await prisma.user.count()).toBe(1);
  });

  it('lets the unique index settle a race: two identical requests, one account', async () => {
    // Both requests pass the "is it taken?" check before either inserts. Only
    // the database's unique index can stop the second one.
    const results = await Promise.all([register(), register()]);

    expect(results.map((res) => res.status).sort()).toEqual([201, 409]);
    expect(await prisma.user.count()).toBe(1);
  });
});

describe('sign in, stay signed in, sign out', () => {
  it('runs the whole journey against real rows', async () => {
    await register();

    const signedIn = await login('  SARA@example.com ');
    expect(signedIn.status).toBe(200);
    const access = signedIn.body.data.accessToken as string;
    const cookie = refreshToken(signedIn);

    const who = await me(access);
    expect(who.status).toBe(200);
    expect(who.body.data.user).toMatchObject({ email: sara.email, firstName: 'Sara' });
    expect(who.body.data.user.passwordHash).toBeUndefined();

    const refreshed = await refresh(cookie);
    expect(refreshed.status).toBe(200);
    expect(await prisma.refreshToken.count({ where: { revokedAt: null } })).toBe(1);
    expect(await prisma.refreshToken.count({ where: { revokedAt: { not: null } } })).toBe(1);

    const signedOut = await logout(refreshToken(refreshed));
    expect(signedOut.status).toBe(200);
    expect(await prisma.refreshToken.count({ where: { revokedAt: null } })).toBe(0);
    // Both access tokens of the session are dead at once.
    expect((await me(access)).status).toBe(401);
    expect((await me(refreshed.body.data.accessToken)).status).toBe(401);
  });

  it('answers a wrong password and an unknown email identically', async () => {
    await register();

    const wrongPassword = await login(sara.email, 'wrong-password');
    const unknownEmail = await login('nobody@example.com');

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body.error).toEqual(wrongPassword.body.error);
    expect(await prisma.refreshToken.count()).toBe(0);
  });

  it('ends every session of the user when a used refresh token is replayed', async () => {
    await register();
    const phone = await login();
    const laptop = await login();
    const first = refreshToken(phone);
    await refresh(first);

    const replay = await refresh(first);

    expect(replay.status).toBe(401);
    expect(await prisma.refreshToken.count({ where: { revokedAt: null } })).toBe(0);
    expect((await me(laptop.body.data.accessToken)).status).toBe(401);
  });

  it('keeps two devices independent', async () => {
    await register();
    const phone = await login();
    const laptop = await login();

    await logout(refreshToken(phone));

    expect((await me(phone.body.data.accessToken)).status).toBe(401);
    expect((await me(laptop.body.data.accessToken)).status).toBe(200);
  });
});

describe('rows that belong together', () => {
  it('removes the refresh tokens when their user is deleted', async () => {
    await register();
    await login();
    await login();
    expect(await prisma.refreshToken.count()).toBe(2);

    await prisma.user.delete({ where: { email: sara.email } });

    expect(await prisma.refreshToken.count()).toBe(0);
  });

  it('sweeps away expired refresh tokens and keeps the rest', async () => {
    await register();
    await login();
    await login();
    const [oldest] = await prisma.refreshToken.findMany({ orderBy: { createdAt: 'asc' } });
    await prisma.refreshToken.update({
      where: { id: oldest!.id },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });

    const removed = await runCleanup();

    expect(removed).toBe(1);
    expect(await prisma.refreshToken.count()).toBe(1);
  });
});
