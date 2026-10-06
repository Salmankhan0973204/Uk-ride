import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Settings for the Prisma CLI (migrate, generate, studio).
 * The running API does not read this file; it connects in src/config/db.ts.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
