import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { env } from './env.js';

/**
 * The one Prisma client of the application. Import it wherever the database
 * is needed; a second client would open a second connection pool.
 * It connects on the first query, not when this file is loaded.
 */
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
