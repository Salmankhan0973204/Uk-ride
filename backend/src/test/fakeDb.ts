import { vi } from 'vitest';

/**
 * A small in-memory stand-in for the Prisma client, for unit tests.
 *
 * It keeps real rows, so a test can follow a session across several requests
 * (sign in, refresh, sign out) without PostgreSQL. It implements only the
 * calls the application makes. Use it like this:
 *
 *   vi.mock('../../config/db.js', async () => ({
 *     prisma: (await import('../../test/fakeDb.js')).fakeDb,
 *   }));
 *
 * Tests against the real database live in the *.itest.ts files.
 */

export interface TokenRow {
  id: string;
  userId: string;
  sessionId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
  [field: string]: unknown;
}

type Where = Record<string, unknown>;

/** Supports plain equality and the one operator the app uses: { gt } / { lt }. */
function matches(row: object, where: Where) {
  return Object.entries(where).every(([key, expected]) => {
    const actual = (row as Record<string, unknown>)[key];
    if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
      const { gt, lt } = expected as { gt?: Date; lt?: Date };
      if (gt) return actual instanceof Date && actual > gt;
      if (lt) return actual instanceof Date && actual < lt;
    }
    return actual === expected;
  });
}

const users: UserRow[] = [];
const tokens: TokenRow[] = [];

export const fakeDb = {
  /** The stored rows, for a test to set up or inspect. */
  users,
  tokens,

  /** Empties the tables and forgets recorded calls. Call it in beforeEach. */
  reset() {
    users.length = 0;
    tokens.length = 0;
    vi.clearAllMocks();
  },

  user: {
    findUnique: vi.fn(({ where }: { where: Where }) =>
      Promise.resolve(users.find((row) => matches(row, where)) ?? null),
    ),
  },

  refreshToken: {
    create: vi.fn(({ data }: { data: Omit<TokenRow, 'id' | 'revokedAt'> }) => {
      const row: TokenRow = { id: `rt-${tokens.length + 1}`, revokedAt: null, ...data };
      tokens.push(row);
      return Promise.resolve(row);
    }),
    findUnique: vi.fn(({ where }: { where: Where }) =>
      Promise.resolve(tokens.find((row) => matches(row, where)) ?? null),
    ),
    findFirst: vi.fn(({ where }: { where: Where }) =>
      Promise.resolve(tokens.find((row) => matches(row, where)) ?? null),
    ),
    updateMany: vi.fn(({ where, data }: { where: Where; data: Partial<TokenRow> }) => {
      const hit = tokens.filter((row) => matches(row, where));
      hit.forEach((row) => Object.assign(row, data));
      return Promise.resolve({ count: hit.length });
    }),
    deleteMany: vi.fn(({ where }: { where: Where }) => {
      const keep = tokens.filter((row) => !matches(row, where));
      const count = tokens.length - keep.length;
      tokens.splice(0, tokens.length, ...keep);
      return Promise.resolve({ count });
    }),
  },
};
