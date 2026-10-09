import { prisma } from '../config/db.js';

/**
 * Starting data the app needs to be usable: `npm run db:seed -w backend`.
 *
 * Safe to run again. Each row is matched on its slug: a missing one is
 * created, an existing one is left exactly as it is, so changes made later
 * by an admin are never overwritten.
 *
 * These are placeholder classes for development, not a real operator's fleet.
 */
const VEHICLE_TYPES = [
  {
    slug: 'saloon',
    name: 'Saloon',
    description: 'A standard four-door car for everyday journeys and airport runs.',
    passengers: 4,
    suitcases: 2,
  },
  {
    slug: 'estate',
    name: 'Estate',
    description: 'The same seats as a saloon with a larger boot for extra luggage.',
    passengers: 4,
    suitcases: 4,
  },
  {
    slug: 'executive',
    name: 'Executive',
    description: 'A premium saloon for business travel, with more room in the back.',
    passengers: 4,
    suitcases: 2,
  },
  {
    slug: 'mpv',
    name: 'People carrier',
    description: 'Six seats for families and small groups travelling together.',
    passengers: 6,
    suitcases: 4,
  },
  {
    slug: 'minibus',
    name: 'Minibus',
    description: 'Eight seats for larger groups, with space for a suitcase each.',
    passengers: 8,
    suitcases: 8,
  },
];

let created = 0;
for (const [index, type] of VEHICLE_TYPES.entries()) {
  const existing = await prisma.vehicleType.findUnique({ where: { slug: type.slug } });
  if (existing) continue;
  await prisma.vehicleType.create({ data: { ...type, sortOrder: (index + 1) * 10 } });
  created += 1;
}

console.log(`Vehicle types: ${created} created, ${VEHICLE_TYPES.length - created} already there.`);
await prisma.$disconnect();
