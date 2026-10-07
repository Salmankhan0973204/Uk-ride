import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../app.js';
import { signAccessToken } from './auth.tokens.js';

// The database is replaced by a fake, so these tests run without PostgreSQL.
const db = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock('../../config/db.js', () => ({ prisma: { user: db } }));

const SECRET = process.env.JWT_ACCESS_SECRET!;

const user = {
  id: 'user-1',
  firstName: 'Sara',
  lastName: 'Khan',
  email: 'sara@example.com',
  mobile: '+447400123456',
  gender: null,
  createdAt: new Date('2026-10-06'),
};

const me = (authorization?: string) => {
  const req = request(app).get('/api/v1/auth/me');
  return authorization === undefined ? req : req.set('Authorization', authorization);
};

const validToken = () => signAccessToken('user-1').accessToken;

beforeEach(() => {
  db.findUnique.mockReset().mockResolvedValue(user);
});

describe('GET /api/v1/auth/me', () => {
  it('returns the signed-in user for a valid token', async () => {
    const res = await me(`Bearer ${validToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user).toEqual({ ...user, createdAt: '2026-10-06T00:00:00.000Z' });
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['www-authenticate']).toBeUndefined();
  });

  it('looks the user up by the id inside the token and never selects the hash', async () => {
    await me(`Bearer ${validToken()}`);

    const query = db.findUnique.mock.calls[0]![0];
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
    expect(db.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    ['another scheme', `Basic ${Buffer.from('sara:secret').toString('base64')}`],
    ['the scheme with no token', 'Bearer'],
    ['extra parts', 'Bearer one two'],
  ])('answers 401 for %s', async (_name, header) => {
    const res = await me(header);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
    expect(db.findUnique).not.toHaveBeenCalled();
  });

  it.each([
    ['text that is not a token', 'not-a-token'],
    ['a token signed with a different secret', jwt.sign({}, 'x'.repeat(40), { subject: 'user-1' })],
    [
      'a token signed with a different algorithm',
      jwt.sign({}, SECRET, { subject: 'user-1', algorithm: 'HS512' }),
    ],
    ['an unsigned token', jwt.sign({}, '', { subject: 'user-1', algorithm: 'none' })],
    ['a token with no user id', jwt.sign({}, SECRET, { algorithm: 'HS256' })],
  ])('answers 401 for %s', async (_name, token) => {
    const res = await me(`Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Your session is not valid. Sign in again.');
    expect(db.findUnique).not.toHaveBeenCalled();
  });

  it('answers 401 and says so when the token has expired', async () => {
    const expired = jwt.sign({}, SECRET, { subject: 'user-1', algorithm: 'HS256', expiresIn: -10 });

    const res = await me(`Bearer ${expired}`);

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Your session has expired. Sign in again.');
  });

  it('answers 401 when the token is valid but the account no longer exists', async () => {
    db.findUnique.mockResolvedValue(null);

    const res = await me(`Bearer ${validToken()}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
});
