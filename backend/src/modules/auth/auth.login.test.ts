import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../app.js';

// The database is replaced by a fake, so these tests run without PostgreSQL.
const db = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock('../../config/db.js', () => ({
  // Signing in also stores a refresh token; auth.session.test.ts covers that.
  prisma: { user: db, refreshToken: { create: vi.fn().mockResolvedValue({}) } },
}));

const PASSWORD = 'secret-pass-1';
const SECRET = process.env.JWT_ACCESS_SECRET!;

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

const login = (body?: object) => {
  const req = request(app).post('/api/v1/auth/login');
  return body ? req.send(body) : req;
};

beforeAll(async () => {
  stored.passwordHash = await bcrypt.hash(PASSWORD, 4);
});

beforeEach(() => {
  db.findUnique.mockReset().mockResolvedValue(stored);
});

describe('POST /api/v1/auth/login', () => {
  it('signs in and returns the user with an access token', async () => {
    const res = await login({ email: 'sara@example.com', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.user).toEqual({
      id: 'user-1',
      firstName: 'Sara',
      lastName: 'Khan',
      email: 'sara@example.com',
      mobile: '+447400123456',
      gender: null,
      createdAt: '2026-10-06T00:00:00.000Z',
    });
    expect(res.body.data.tokenType).toBe('Bearer');
    expect(res.body.data.expiresIn).toBe(900);
    expect(typeof res.body.data.accessToken).toBe('string');
  });

  it('issues a token that is signed, names the user and expires in 15 minutes', async () => {
    const res = await login({ email: 'sara@example.com', password: PASSWORD });

    const payload = jwt.verify(res.body.data.accessToken, SECRET, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload;

    expect(payload.sub).toBe('user-1');
    expect(payload.exp! - payload.iat!).toBe(900);
    // Signed with a different secret, the same token must not verify.
    expect(() => jwt.verify(res.body.data.accessToken, 'x'.repeat(40))).toThrow();
  });

  it('never returns the password or its hash, and forbids caching', async () => {
    const res = await login({ email: 'sara@example.com', password: PASSWORD });

    const body = JSON.stringify(res.body);
    expect(body).not.toContain(PASSWORD);
    expect(body).not.toContain('passwordHash');
    expect(body).not.toContain(stored.passwordHash);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('cleans the email before looking it up', async () => {
    const res = await login({ email: '  Sara@Example.COM ', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(db.findUnique.mock.calls[0]![0].where).toEqual({ email: 'sara@example.com' });
  });

  it('answers 401 for a wrong password', async () => {
    const res = await login({ email: 'sara@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({
      code: 'UNAUTHENTICATED',
      message: 'Email or password is incorrect',
    });
    expect(res.body.data).toBeUndefined();
  });

  it('gives an unknown email exactly the same answer as a wrong password', async () => {
    const wrongPassword = await login({ email: 'sara@example.com', password: 'wrong-password' });
    db.findUnique.mockResolvedValue(null);
    const unknownEmail = await login({ email: 'nobody@example.com', password: PASSWORD });

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body.error).toEqual(wrongPassword.body.error);
  });

  it('answers 400 naming the missing fields and does not touch the database', async () => {
    const res = await login({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual({
      email: ['Enter a valid email address'],
      password: ['Password is required'],
    });
    expect(db.findUnique).not.toHaveBeenCalled();
  });
});
