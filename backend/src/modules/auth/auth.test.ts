import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../app.js';
import { Prisma } from '../../generated/prisma/client.js';

// The database is replaced by a fake, so these tests run without PostgreSQL.
const db = vi.hoisted(() => ({ findFirst: vi.fn(), create: vi.fn() }));
vi.mock('../../config/db.js', () => ({ prisma: { user: db } }));
// Sending the confirmation email is covered by the integration tests.
const emails = vi.hoisted(() => ({ sendVerificationEmail: vi.fn(), sendInBackground: vi.fn() }));
vi.mock('./auth.emails.js', () => emails);

const validBody = {
  firstName: 'Sara',
  lastName: 'Khan',
  email: 'sara@example.com',
  mobile: '+447400123456',
  gender: 'FEMALE',
  password: 'secret-pass-1',
};

const register = (body?: object) => {
  const req = request(app).post('/api/v1/auth/register');
  return body ? req.send(body) : req;
};

beforeEach(() => {
  db.findFirst.mockReset().mockResolvedValue(null);
  db.create.mockReset().mockImplementation(({ data }: { data: Record<string, unknown> }) => {
    const { passwordHash: _hash, ...rest } = data;
    return Promise.resolve({ id: 'user-1', ...rest, createdAt: new Date('2026-10-06') });
  });
});

describe('POST /api/v1/auth/register', () => {
  it('creates the account and never returns the password or its hash', async () => {
    const res = await register(validBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toEqual({
      id: 'user-1',
      firstName: 'Sara',
      lastName: 'Khan',
      email: 'sara@example.com',
      mobile: '+447400123456',
      gender: 'FEMALE',
      createdAt: '2026-10-06T00:00:00.000Z',
    });
    expect(JSON.stringify(res.body)).not.toContain('secret-pass-1');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('stores a bcrypt hash, not the password', async () => {
    await register(validBody);

    const { data, select } = db.create.mock.calls[0]![0];
    expect(data.passwordHash).not.toBe(validBody.password);
    expect(await bcrypt.compare(validBody.password, data.passwordHash)).toBe(true);
    expect(select.passwordHash).toBeUndefined();
  });

  it('cleans the email, names and mobile number before saving them', async () => {
    const res = await register({
      ...validBody,
      firstName: '  Anne-Marie ',
      lastName: " O'Neil ",
      email: '  Sara@Example.COM ',
      mobile: '0044 (7400) 123-456',
    });

    expect(res.status).toBe(201);
    expect(db.create.mock.calls[0]![0].data).toMatchObject({
      firstName: 'Anne-Marie',
      lastName: "O'Neil",
      email: 'sara@example.com',
      mobile: '+447400123456',
    });
  });

  it('accepts a mobile number from any country', async () => {
    const res = await register({ ...validBody, mobile: '+92 300 1234567' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.mobile).toBe('+923001234567');
  });

  it.each([
    [
      'too few digits for its country',
      '+44 7400 1234',
      'That is not a valid number for its country. Check the digits',
    ],
    [
      'too many digits for its country',
      '+44 7400 123456 789',
      'That is not a valid number for its country. Check the digits',
    ],
    [
      'a country code that does not exist',
      '+999 123 456 789',
      'That is not a valid number for its country. Check the digits',
    ],
    ['a landline', '+44 20 7946 0000', 'That looks like a landline. Enter a mobile number'],
  ])('refuses a mobile number with %s', async (_name, mobile, message) => {
    const res = await register({ ...validBody, mobile });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual({ mobile: [message] });
    expect(db.create).not.toHaveBeenCalled();
  });

  it('accepts a number from a country where mobiles and landlines share ranges', async () => {
    const res = await register({ ...validBody, mobile: '+1 202 555 0123' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.mobile).toBe('+12025550123');
  });

  it('saves gender as null when it is left out', async () => {
    const { gender: _gender, ...withoutGender } = validBody;
    const res = await register(withoutGender);

    expect(res.status).toBe(201);
    expect(db.create.mock.calls[0]![0].data.gender).toBeNull();
  });

  it('answers 400 with a message per field and does not touch the database', async () => {
    const res = await register({
      firstName: 'S4ra',
      lastName: '',
      email: 'not-an-email',
      mobile: '07400 123456',
      gender: 'ROBOT',
      password: 'abc',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual({
      firstName: ['First name can only contain letters, spaces, hyphens and apostrophes'],
      lastName: ['Last name is required'],
      email: ['Enter a valid email address'],
      mobile: ['Enter a mobile number with its country code, like +44 7400 123456'],
      gender: ['Choose one of the listed options'],
      password: ['Password must be at least 8 characters'],
    });
    expect(db.findFirst).not.toHaveBeenCalled();
    expect(db.create).not.toHaveBeenCalled();
  });

  it('answers 400 naming the missing fields when there is no body', async () => {
    const res = await register();

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual({
      firstName: ['First name is required'],
      lastName: ['Last name is required'],
      email: ['Email is required'],
      mobile: ['Mobile number is required'],
      password: ['Password is required'],
    });
  });

  it('answers 409 naming the email when it is already registered', async () => {
    db.findFirst.mockResolvedValue({ email: 'sara@example.com' });

    const res = await register(validBody);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.details).toEqual({ field: 'email' });
    expect(db.create).not.toHaveBeenCalled();
  });

  it('answers 409 naming the mobile number when another account has it', async () => {
    db.findFirst.mockResolvedValue({ email: 'someone-else@example.com' });

    const res = await register(validBody);

    expect(res.status).toBe(409);
    expect(res.body.error.details).toEqual({ field: 'mobile' });
    expect(db.create).not.toHaveBeenCalled();
  });

  it('answers 409 when the unique index rejects a racing request', async () => {
    db.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    const res = await register(validBody);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});
