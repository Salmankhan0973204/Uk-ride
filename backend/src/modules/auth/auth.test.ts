import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../app.js';
import { Prisma } from '../../generated/prisma/client.js';

// The database is replaced by a fake, so these tests run without PostgreSQL.
const db = vi.hoisted(() => ({ findUnique: vi.fn(), create: vi.fn() }));
vi.mock('../../config/db.js', () => ({ prisma: { user: db } }));

const validBody = { email: 'sara@example.com', password: 'secret-pass-1' };

beforeEach(() => {
  db.findUnique.mockReset().mockResolvedValue(null);
  db.create
    .mockReset()
    .mockImplementation(({ data }: { data: { email: string } }) =>
      Promise.resolve({ id: 'user-1', email: data.email, createdAt: new Date('2026-10-06') }),
    );
});

describe('POST /api/v1/auth/register', () => {
  it('creates the account and never returns the password or its hash', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toEqual({
      id: 'user-1',
      email: 'sara@example.com',
      createdAt: '2026-10-06T00:00:00.000Z',
    });
    expect(JSON.stringify(res.body)).not.toContain('secret-pass-1');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('stores a bcrypt hash, not the password', async () => {
    await request(app).post('/api/v1/auth/register').send(validBody);

    const { data, select } = db.create.mock.calls[0]![0];
    expect(data.passwordHash).not.toBe(validBody.password);
    expect(await bcrypt.compare(validBody.password, data.passwordHash)).toBe(true);
    expect(select).toEqual({ id: true, email: true, createdAt: true });
  });

  it('trims and lower-cases the email before looking it up and saving it', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validBody, email: '  Sara@Example.COM ' });

    expect(res.status).toBe(201);
    expect(db.findUnique.mock.calls[0]![0].where).toEqual({ email: 'sara@example.com' });
    expect(db.create.mock.calls[0]![0].data.email).toBe('sara@example.com');
  });

  it('answers 400 with a message per field and does not touch the database', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual({
      email: ['Enter a valid email address'],
      password: ['Password must be at least 8 characters'],
    });
    expect(db.findUnique).not.toHaveBeenCalled();
    expect(db.create).not.toHaveBeenCalled();
  });

  it('answers 400 naming the missing fields when there is no body', async () => {
    const res = await request(app).post('/api/v1/auth/register');

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual({
      email: ['Email is required'],
      password: ['Password is required'],
    });
  });

  it('answers 409 when the email is already registered', async () => {
    db.findUnique.mockResolvedValue({ id: 'user-0' });

    const res = await request(app).post('/api/v1/auth/register').send(validBody);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(db.create).not.toHaveBeenCalled();
  });

  it('answers 409 when the unique index rejects a racing request', async () => {
    db.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    const res = await request(app).post('/api/v1/auth/register').send(validBody);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});
