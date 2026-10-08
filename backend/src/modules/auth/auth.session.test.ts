import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../app.js';
import { fakeDb } from '../../test/fakeDb.js';

// An in-memory fake of the tables, so a session can be followed across
// several requests without PostgreSQL.
vi.mock('../../config/db.js', async () => ({
  prisma: (await import('../../test/fakeDb.js')).fakeDb,
}));

const PASSWORD = 'secret-pass-1';
const SECRET = process.env.JWT_ACCESS_SECRET!;
const COOKIE = 'ukride_refresh';
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

const stored = {
  id: 'user-1',
  firstName: 'Sara',
  lastName: 'Khan',
  email: 'sara@example.com',
  mobile: '+447400123456',
  gender: null,
  createdAt: new Date('2026-10-06'),
  passwordHash: '',
};

/** The Set-Cookie line for the refresh cookie, and the token inside it. */
function refreshCookie(res: request.Response) {
  const lines = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  const line = lines.find((entry) => entry.startsWith(`${COOKIE}=`));
  return { line, token: line?.split(';')[0]?.slice(COOKIE.length + 1) ?? '' };
}

const login = () =>
  request(app).post('/api/v1/auth/login').send({ email: stored.email, password: PASSWORD });
const withCookie = (path: string, token?: string) => {
  const req = request(app).post(path);
  return token === undefined ? req : req.set('Cookie', `${COOKIE}=${token}`);
};
const refresh = (token?: string) => withCookie('/api/v1/auth/refresh', token);
const logout = (token?: string) => withCookie('/api/v1/auth/logout', token);
const me = (accessToken: string) =>
  request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`);

const sessionOf = (accessToken: string) => (jwt.decode(accessToken) as jwt.JwtPayload).sid;

beforeAll(async () => {
  stored.passwordHash = await bcrypt.hash(PASSWORD, 4);
});

beforeEach(() => {
  fakeDb.reset();
  fakeDb.users.push({ ...stored });
});

describe('POST /api/v1/auth/login: the refresh cookie', () => {
  it('sets a locked-down cookie and keeps the token out of the body', async () => {
    const res = await login();
    const { line, token } = refreshCookie(res);

    expect(res.status).toBe(200);
    expect(token.length).toBeGreaterThanOrEqual(43); // 32 random bytes
    expect(line).toContain('HttpOnly');
    expect(line).toContain('SameSite=Strict');
    expect(line).toContain('Path=/api/v1/auth');
    expect(line).toMatch(/Expires=/);
    expect(JSON.stringify(res.body)).not.toContain(token);
  });

  it('stores only a hash of the token, for 7 days, in a new session', async () => {
    const before = Date.now();
    const res = await login();
    const { token } = refreshCookie(res);

    expect(fakeDb.tokens).toHaveLength(1);
    const row = fakeDb.tokens[0]!;
    expect(row.userId).toBe('user-1');
    expect(row.tokenHash).toBe(sha256(token));
    expect(row.tokenHash).not.toBe(token);
    const days = (row.expiresAt.getTime() - before) / 86_400_000;
    expect(days).toBeGreaterThan(6.99);
    expect(days).toBeLessThan(7.01);
    // The access token names the same session as the stored row.
    expect(sessionOf(res.body.data.accessToken)).toBe(row.sessionId);
  });

  it('gives each sign-in its own session', async () => {
    await login();
    await login();

    expect(fakeDb.tokens[0]!.sessionId).not.toBe(fakeDb.tokens[1]!.sessionId);
  });

  it('sets no cookie when the password is wrong', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: stored.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(refreshCookie(res).line).toBeUndefined();
    expect(fakeDb.tokens).toHaveLength(0);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('returns a new access token and replaces the cookie', async () => {
    const first = refreshCookie(await login()).token;

    const res = await refresh(first);
    const second = refreshCookie(res).token;

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ tokenType: 'Bearer', expiresIn: 900 });
    const payload = jwt.verify(res.body.data.accessToken, SECRET, { algorithms: ['HS256'] });
    expect((payload as jwt.JwtPayload).sub).toBe('user-1');
    expect(second).not.toBe('');
    expect(second).not.toBe(first);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('rotates inside one session: old token dead, new token works, same session id', async () => {
    const signedIn = await login();
    const first = refreshCookie(signedIn).token;
    const refreshed = await refresh(first);
    const second = refreshCookie(refreshed).token;

    expect(fakeDb.tokens.find((row) => row.tokenHash === sha256(first))!.revokedAt).not.toBeNull();
    expect(fakeDb.tokens[1]!.sessionId).toBe(fakeDb.tokens[0]!.sessionId);
    expect(sessionOf(refreshed.body.data.accessToken)).toBe(
      sessionOf(signedIn.body.data.accessToken),
    );
    expect((await refresh(second)).status).toBe(200);
  });

  it('ends every session of the user when a used token comes back', async () => {
    const first = refreshCookie(await login()).token;
    const second = refreshCookie(await refresh(first)).token;
    const otherDevice = refreshCookie(await login()).token;

    // Someone replays the token that was already rotated away.
    const replay = await refresh(first);

    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe('UNAUTHENTICATED');
    expect(fakeDb.tokens.every((row) => row.revokedAt !== null)).toBe(true);
    // Both the current token and the other device are signed out.
    expect((await refresh(second)).status).toBe(401);
    expect((await refresh(otherDevice)).status).toBe(401);
  });

  it('lets only one of two simultaneous requests with the same token succeed', async () => {
    const token = refreshCookie(await login()).token;

    const results = await Promise.all([refresh(token), refresh(token)]);

    expect(results.map((res) => res.status).sort()).toEqual([200, 401]);
  });

  it('answers 401 and clears the cookie when there is no cookie', async () => {
    const res = await refresh();

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Your session has ended. Sign in again.');
    expect(refreshCookie(res).line).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it('answers 401 for a token that was never issued', async () => {
    const res = await refresh('made-up-token');

    expect(res.status).toBe(401);
    expect(fakeDb.tokens).toHaveLength(0);
  });

  it('answers 401 for an expired token and does not issue a new one', async () => {
    const token = refreshCookie(await login()).token;
    fakeDb.tokens[0]!.expiresAt = new Date(Date.now() - 1_000);

    const res = await refresh(token);

    expect(res.status).toBe(401);
    expect(fakeDb.tokens).toHaveLength(1);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('revokes the token, clears the cookie, and the token no longer refreshes', async () => {
    const token = refreshCookie(await login()).token;

    const res = await logout(token);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: 'Signed out', data: null });
    expect(refreshCookie(res).line).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(fakeDb.tokens[0]!.revokedAt).not.toBeNull();
    expect((await refresh(token)).status).toBe(401);
  });

  it('cuts off the access token at once, not after 15 minutes', async () => {
    const signedIn = await login();
    const accessToken = signedIn.body.data.accessToken as string;
    expect((await me(accessToken)).status).toBe(200);

    await logout(refreshCookie(signedIn).token);
    const after = await me(accessToken);

    expect(after.status).toBe(401);
    expect(after.body.error.message).toBe('Your session has ended. Sign in again.');
  });

  it('also cuts off an access token issued before a rotation', async () => {
    const signedIn = await login();
    const oldAccess = signedIn.body.data.accessToken as string;
    const rotated = refreshCookie(await refresh(refreshCookie(signedIn).token)).token;

    await logout(rotated);

    expect((await me(oldAccess)).status).toBe(401);
  });

  it('signs out one device and leaves the other fully signed in', async () => {
    const phone = await login();
    const laptop = await login();

    await logout(refreshCookie(phone).token);

    expect((await me(phone.body.data.accessToken)).status).toBe(401);
    expect((await me(laptop.body.data.accessToken)).status).toBe(200);
    expect((await refresh(refreshCookie(laptop).token)).status).toBe(200);
  });

  it('succeeds with no cookie, so signing out twice is not an error', async () => {
    const res = await logout();

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Signed out');
  });
});
