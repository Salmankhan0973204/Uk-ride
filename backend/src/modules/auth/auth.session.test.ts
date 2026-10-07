import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../app.js';

/**
 * The database is replaced by a small in-memory fake of the refresh_tokens
 * table, so rotation can be followed across several requests without
 * PostgreSQL.
 */
interface Row {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

const fake = vi.hoisted(() => {
  const rows: Row[] = [];
  const matches = (row: Row, where: Partial<Row>) =>
    Object.entries(where).every(([key, value]) => row[key as keyof Row] === value);

  return {
    rows,
    user: { findUnique: vi.fn() },
    refreshToken: {
      create: vi.fn(({ data }: { data: Omit<Row, 'id' | 'revokedAt'> }) => {
        const row = { id: `rt-${rows.length + 1}`, revokedAt: null, ...data };
        rows.push(row);
        return Promise.resolve(row);
      }),
      findUnique: vi.fn(({ where }: { where: { tokenHash: string } }) =>
        Promise.resolve(rows.find((row) => row.tokenHash === where.tokenHash) ?? null),
      ),
      updateMany: vi.fn(({ where, data }: { where: Partial<Row>; data: Partial<Row> }) => {
        const hit = rows.filter((row) => matches(row, where));
        hit.forEach((row) => Object.assign(row, data));
        return Promise.resolve({ count: hit.length });
      }),
    },
  };
});
vi.mock('../../config/db.js', () => ({ prisma: fake }));

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
const refresh = (token?: string) => {
  const req = request(app).post('/api/v1/auth/refresh');
  return token === undefined ? req : req.set('Cookie', `${COOKIE}=${token}`);
};
const logout = (token?: string) => {
  const req = request(app).post('/api/v1/auth/logout');
  return token === undefined ? req : req.set('Cookie', `${COOKIE}=${token}`);
};

beforeAll(async () => {
  stored.passwordHash = await bcrypt.hash(PASSWORD, 4);
});

beforeEach(() => {
  fake.rows.length = 0;
  fake.user.findUnique.mockReset().mockResolvedValue(stored);
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

  it('stores only a hash of the token, for 7 days', async () => {
    const before = Date.now();
    const { token } = refreshCookie(await login());

    expect(fake.rows).toHaveLength(1);
    const row = fake.rows[0]!;
    expect(row.userId).toBe('user-1');
    expect(row.tokenHash).toBe(sha256(token));
    expect(row.tokenHash).not.toBe(token);
    const days = (row.expiresAt.getTime() - before) / 86_400_000;
    expect(days).toBeGreaterThan(6.99);
    expect(days).toBeLessThan(7.01);
  });

  it('sets no cookie when the password is wrong', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: stored.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(refreshCookie(res).line).toBeUndefined();
    expect(fake.rows).toHaveLength(0);
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

  it('rotates: the old token stops working and the new one works', async () => {
    const first = refreshCookie(await login()).token;
    const second = refreshCookie(await refresh(first)).token;

    expect(fake.rows.find((row) => row.tokenHash === sha256(first))!.revokedAt).not.toBeNull();
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
    expect(fake.rows.every((row) => row.revokedAt !== null)).toBe(true);
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
    expect(fake.rows).toHaveLength(0);
  });

  it('answers 401 for an expired token and does not issue a new one', async () => {
    const token = refreshCookie(await login()).token;
    fake.rows[0]!.expiresAt = new Date(Date.now() - 1_000);

    const res = await refresh(token);

    expect(res.status).toBe(401);
    expect(fake.rows).toHaveLength(1);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('revokes the token, clears the cookie, and the token no longer refreshes', async () => {
    const token = refreshCookie(await login()).token;

    const res = await logout(token);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, message: 'Signed out', data: null });
    expect(refreshCookie(res).line).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(fake.rows[0]!.revokedAt).not.toBeNull();
    expect((await refresh(token)).status).toBe(401);
  });

  it('signs out one device and leaves the other signed in', async () => {
    const phone = refreshCookie(await login()).token;
    const laptop = refreshCookie(await login()).token;

    await logout(phone);

    expect((await refresh(laptop)).status).toBe(200);
  });

  it('succeeds with no cookie, so signing out twice is not an error', async () => {
    const res = await logout();

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Signed out');
  });
});
