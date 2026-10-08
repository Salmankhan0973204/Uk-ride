import { prisma } from '../config/db.js';
import { env } from '../config/env.js';

/**
 * Empties every table. Call it in beforeEach of an integration test, so each
 * test starts from nothing and cannot depend on another.
 */
export async function resetDatabase() {
  // The guard that keeps this away from real data: it only ever runs against
  // a database whose name ends in "_test".
  const database = new URL(env.DATABASE_URL).pathname.slice(1);
  if (!database.endsWith('_test')) {
    throw new Error(`Refusing to empty "${database}": it is not a test database.`);
  }

  // CASCADE follows the foreign keys, so refresh_tokens goes with users.
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
}

export { prisma };
