import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Settings for the Prisma CLI (migrate, generate, studio).
 * The running API does not read this file; it connects in src/config/db.ts.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  // `seed` is what `prisma db seed` runs; `npm run db:seed` runs the same file.
  migrations: { path: 'prisma/migrations', seed: 'tsx src/db/seed.ts' },
  datasource: { url: env('DATABASE_URL') },
});
