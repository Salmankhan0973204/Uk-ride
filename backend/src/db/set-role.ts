import { prisma } from '../config/db.js';
import { Role } from '../generated/prisma/client.js';

/**
 * Gives an existing account a role:
 *
 *   npm run db:set-role -w backend -- sara@example.com ADMIN
 *
 * There is no screen for this on purpose. The first admin cannot be made by
 * an admin, so it is done by whoever can reach the database.
 */
const [email, role] = process.argv.slice(2);
const roles = Object.values(Role);

if (!email || !roles.includes(role as Role)) {
  console.error(`Usage: npm run db:set-role -w backend -- <email> <${roles.join(' | ')}>`);
  process.exit(1);
}

const { count } = await prisma.user.updateMany({
  where: { email: email.trim().toLowerCase() },
  data: { role: role as Role },
});

console.log(count === 1 ? `${email} is now ${role}.` : `No account has the email ${email}.`);
await prisma.$disconnect();
process.exit(count === 1 ? 0 : 1);
