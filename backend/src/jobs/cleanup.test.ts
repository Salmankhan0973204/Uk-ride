import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeDb } from '../test/fakeDb.js';
import type { TokenRow } from '../test/fakeDb.js';
import { runCleanup } from './cleanup.js';

vi.mock('../config/db.js', async () => ({
  prisma: (await import('../test/fakeDb.js')).fakeDb,
}));

const DAY_MS = 86_400_000;
let next = 0;

function token(overrides: Partial<TokenRow>): TokenRow {
  next += 1;
  return {
    id: `rt-${next}`,
    userId: 'user-1',
    sessionId: `session-${next}`,
    tokenHash: `hash-${next}`,
    expiresAt: new Date(Date.now() + DAY_MS),
    revokedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  fakeDb.reset();
});

describe('runCleanup', () => {
  it('removes tokens that have expired and reports how many', async () => {
    fakeDb.tokens.push(
      token({ id: 'expired-1', expiresAt: new Date(Date.now() - DAY_MS) }),
      token({ id: 'expired-2', expiresAt: new Date(Date.now() - 1_000), revokedAt: new Date() }),
      token({ id: 'live' }),
    );

    const removed = await runCleanup();

    expect(removed).toBe(2);
    expect(fakeDb.tokens.map((row) => row.id)).toEqual(['live']);
  });

  it('keeps a revoked token until it expires, so a replay can still be recognised', async () => {
    fakeDb.tokens.push(token({ id: 'used', revokedAt: new Date() }));

    const removed = await runCleanup();

    expect(removed).toBe(0);
    expect(fakeDb.tokens.map((row) => row.id)).toEqual(['used']);
  });

  it('returns 0 and does not throw when the database fails', async () => {
    fakeDb.refreshToken.deleteMany.mockRejectedValueOnce(new Error('connection lost'));

    await expect(runCleanup()).resolves.toBe(0);
  });
});
