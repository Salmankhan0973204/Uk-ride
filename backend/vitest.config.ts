import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Tests mock the database, so this URL only has to pass env validation.
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/ukride_test',
      JWT_ACCESS_SECRET: 'test-only-secret-never-used-outside-the-test-run',
    },
  },
});
