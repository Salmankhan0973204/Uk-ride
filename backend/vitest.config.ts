import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // No tests exist at the moment. A test file placed beside the code it
    // tests, named *.test.ts, is picked up automatically. These values only
    // have to pass env validation.
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/ukride_test',
      JWT_ACCESS_SECRET: 'test-only-secret-never-used-outside-the-test-run',
    },
  },
});
