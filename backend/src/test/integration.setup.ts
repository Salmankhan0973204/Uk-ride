import { execSync } from 'node:child_process';
import pg from 'pg';
import { TEST_DATABASE_URL } from './testDatabaseUrl.js';

/**
 * Runs once before the integration tests: makes sure the test database exists
 * and has the current tables.
 */
export default async function setup() {
  const url = new URL(TEST_DATABASE_URL);
  const database = url.pathname.slice(1);

  // Connect to the default maintenance database to create ours.
  const admin = new URL(TEST_DATABASE_URL);
  admin.pathname = '/postgres';

  const client = new pg.Client({ connectionString: admin.toString() });
  try {
    await client.connect();
  } catch {
    throw new Error(
      'Integration tests need PostgreSQL. Start it with "npm run docker:up" and try again.',
    );
  }

  try {
    const found = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
    if (found.rowCount === 0) {
      // The name comes from our own config file, never from user input.
      await client.query(`CREATE DATABASE "${database}"`);
    }
  } finally {
    await client.end();
  }

  // The same migration files that build the development database build this one.
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'pipe',
  });
}
