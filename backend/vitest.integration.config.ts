import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL } from './src/test/testDatabaseUrl.ts';

/**
 * Integration tests: the real application against a real PostgreSQL database.
 *
 *   npm run test:integration -w backend
 *
 * They use their own database, `ukride_test`. It is created and migrated
 * automatically (see src/test/integration.setup.ts) and emptied before every
 * test.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.itest.ts'],
    globalSetup: ['src/test/integration.setup.ts'],
    // Every file shares one database, so files run one after another.
    fileParallelism: false,
    testTimeout: 20_000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_ACCESS_SECRET: 'test-only-secret-never-used-outside-the-test-run',
    },
  },
});
