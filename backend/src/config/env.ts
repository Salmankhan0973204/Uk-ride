import 'dotenv/config';
import { createRequire } from 'node:module';
import { z } from 'zod';

/**
 * Environment validation.
 * The app refuses to start when configuration is invalid, so a bad .env is
 * found at boot instead of at the first request that needs the value.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  // Signs access tokens. Anyone who knows it can forge a login, so it must be
  // long, random and different in every environment.
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  // How long an access token is valid. Short on purpose: 15 minutes.
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).max(86_400).default(900),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json') as { version: string };

export const APP_VERSION = pkg.version;
export const SERVICE_NAME = 'ukride-api';
