import { prisma } from '../config/db.js';
import { runCleanup } from './cleanup.js';

// Runs one sweep and exits: `npm run db:cleanup -w backend`.
const removed = await runCleanup();
console.log(`Removed ${removed} expired refresh token(s).`);
await prisma.$disconnect();
