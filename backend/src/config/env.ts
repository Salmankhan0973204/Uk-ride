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
    .default('http://localhost:3000,http://localhost:3001')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  // Short-lived shared counters, such as codes sent per phone. Redis from docker-compose.yml.
  REDIS_URL: z.url({ protocol: /^rediss?$/ }).default('redis://localhost:6379'),
  // Signs access tokens. Anyone who knows it can forge a login, so it must be
  // long, random and different in every environment.
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  // How long an access token is valid. Short on purpose: 15 minutes.
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(60).max(86_400).default(900),
  // How long someone stays signed in without typing their password again.
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  // How long a staff member stays signed in to the admin panel: one working day.
  STAFF_SESSION_HOURS: z.coerce.number().int().min(1).max(72).default(12),
  // Where email is handed over. The defaults are Mailpit from docker-compose.yml,
  // which catches every message: read them at http://localhost:8025.
  SMTP_HOST: z.string().min(1).default('localhost'),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(1025),
  MAIL_FROM: z.string().min(3).default('UkRide <no-reply@ukride.local>'),
  // Finds UK postcodes on the map. postcodes.io is free and needs no key.
  POSTCODES_API_URL: z
    .url()
    .default('https://api.postcodes.io')
    .transform((value) => value.replace(/\/+$/, '')),
  // Measures road distance: an OSRM server. The default is the public demo
  // server, free but with no promise of staying up; point this at another
  // host, or our own OSRM, before going live.
  ROUTING_API_URL: z
    .url()
    .default('https://router.project-osrm.org')
    .transform((value) => value.replace(/\/+$/, '')),
  // Addresses of the two web apps. Links inside customer emails go to the
  // customer site; links for staff go to the admin panel.
  CUSTOMER_APP_URL: z
    .url()
    .default('http://localhost:3000')
    .transform((value) => value.replace(/\/+$/, '')),
  ADMIN_APP_URL: z
    .url()
    .default('http://localhost:3001')
    .transform((value) => value.replace(/\/+$/, '')),
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
