import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../app.js';
import { fakeDb } from '../../test/fakeDb.js';
import { signAccessToken } from './auth.tokens.js';

// The database is replaced by an in-memory fake, so these tests run without PostgreSQL.
vi.mock('../../config/db.js', async () => ({
  prisma: (await import('../../test/fakeDb.js')).fakeDb,
}));

const SECRET = process.env.JWT_ACCESS_SECRET!;
const SESSION = 'session-1';

const user = {
  id: 'user-1',
  firstName: 'Sara',
  lastName: 'Khan',
  email: 'sara@example.com',
  mobile: '+447400123456',
  gender: null,
  createdAt: new Date('2026-10-06'),
  passwordHash: 'not-used-here',
};

const me = (authorization?: string) => {
  const req = request(app).get('/api/v1/auth/me');
  return authorization === undefined ? req : req.set('Authorization', authorization);
};

const validToken = () => signAccessToken({ userId: 'user-1', sessionId: SESSION }).accessToken;

/** A token signed by hand, to build ones the API would never issue. */
const craft = (options: jwt.SignOptions, secret = SECRET, claims: object = { sid: SESSION }) =>
  jwt.sign(claims, secret, { subject: 'user-1', algorithm: 'HS256', ...options });

beforeEach(() => {
  fakeDb.reset();
  fakeDb.users.push({ ...user });
  // The signed-in session the tokens below belong to.
  fakeDb.tokens.push({
    id: 'rt-1',
    userId: 'user-1',
    sessionId: SESSION,
    tokenHash: 'hash-1',
    expiresAt: new Date(Date.now() + 86_400_000),
    revokedAt: null,
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns the signed-in user for a valid token', async () => {
    const res = await me(`Bearer ${validToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ id: 'user-1', email: 'sara@example.com' });
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['www-authenticate']).toBeUndefined();
  });

  it('looks the user up by the id inside the token and never selects the hash', async () => {
    await me(`Bearer ${validToken()}`);

    const query = fakeDb.user.findUnique.mock.calls[0]![0] as {
      where: object;
      select: Record<string, unknown>;
    };
    expect(query.where).toEqual({ id: 'user-1' });
    expect(query.select.passwordHash).toBeUndefined();
  });

  it('accepts the scheme in any letter case', async () => {
    const res = await me(`bearer ${validToken()}`);

    expect(res.status).toBe(200);
  });

  it('answers 401 without a token and does not touch the database', async () => {
    const res = await me();

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({ code: 'UNAUTHENTICATED', message: 'Sign in to continue' });
    expect(res.headers['www-authenticate']).toBe('Bearer');
    expect(fakeDb.user.findUnique).not.toHaveBeenCalled();
    expect(fakeDb.refreshToken.findFirst).not.toHaveBeenCalled();
  });

  it.each([
    ['another scheme', `Basic ${Buffer.from('sara:secret').toString('base64')}`],
    ['the scheme with no token', 'Bearer'],
    ['extra parts', 'Bearer one two'],
  ])('answers 401 for %s', async (_name, header) => {
    const res = await me(header);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
    expect(fakeDb.user.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    ['text that is not a token', 'not-a-token'],
    ['a token signed with a different secret', craft({}, 'x'.repeat(40))],
    ['a token signed with a different algorithm', craft({ algorithm: 'HS512' })],
    ['an unsigned token', craft({ algorithm: 'none' }, '')],
    ['a token with no user id', jwt.sign({ sid: SESSION }, SECRET, { algorithm: 'HS256' })],
    ['a token with no session id', craft({}, SECRET, {})],
  ])('answers 401 for %s', async (_name, token) => {
    const res = await me(`Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Your session is not valid. Sign in again.');
    expect(fakeDb.user.findUnique).not.toHaveBeenCalled();
  });

  it('answers 401 and says so when the token has expired', async () => {
    const res = await me(`Bearer ${craft({ expiresIn: -10 })}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Your session has expired. Sign in again.');
  });

  it('answers 401 when the token is valid but the account no longer exists', async () => {
    fakeDb.users.length = 0;

    const res = await me(`Bearer ${validToken()}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});

describe('GET /api/v1/auth/me: the session behind the token', () => {
  const ended = 'Your session has ended. Sign in again.';

  it('refuses a good token once its session has been signed out', async () => {
    fakeDb.tokens[0]!.revokedAt = new Date();

    const res = await me(`Bearer ${validToken()}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe(ended);
    expect(fakeDb.user.findUnique).not.toHaveBeenCalled();
  });

  it('refuses a good token once its session has run out', async () => {
    fakeDb.tokens[0]!.expiresAt = new Date(Date.now() - 1_000);

    const res = await me(`Bearer ${validToken()}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe(ended);
  });

  it('refuses a good token that names a session which never existed', async () => {
    const token = signAccessToken({ userId: 'user-1', sessionId: 'made-up' }).accessToken;

    const res = await me(`Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe(ended);
  });

  it('keeps accepting the token after rotation, while the session lives on', async () => {
    // Rotation: the first refresh token is used up, a second one takes over.
    fakeDb.tokens[0]!.revokedAt = new Date();
    fakeDb.tokens.push({
      id: 'rt-2',
      userId: 'user-1',
      sessionId: SESSION,
      tokenHash: 'hash-2',
      expiresAt: new Date(Date.now() + 86_400_000),
      revokedAt: null,
    });

    const res = await me(`Bearer ${validToken()}`);

    expect(res.status).toBe(200);
  });
});
