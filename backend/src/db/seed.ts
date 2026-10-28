import { prisma } from '../config/db.js';

/**
 * Starting data the app needs to be usable: `npm run db:seed -w backend`.
 *
 * Safe to run again. Each row is matched on its slug: a missing one is
 * created, an existing one is left exactly as it is, so changes made later
 * by an admin are never overwritten.
 *
 * The six classes of ukride.uk, in the order its fleet section lists them.
 * `exampleModels` is shown as "Cars like ... or similar". Hand luggage is not
 * published there, so it is one bag per passenger until an admin says otherwise.
 */
const VEHICLE_TYPES = [
  {
    slug: '8-seater',
    name: '8 Seater',
    description: 'Eight seats and a case each, for groups and families travelling together.',
    exampleModels: 'VW Transporter, Mercedes Vito',
    passengers: 8,
    suitcases: 8,
    handLuggage: 8,
  },
  {
    slug: 'executive',
    name: 'Executive',
    description: 'A premium saloon for business travel, with more room in the back.',
    exampleModels: 'BMW 5 Series, Mercedes E Class, Tesla Model S',
    passengers: 3,
    suitcases: 4,
    handLuggage: 3,
  },
  {
    slug: 'mpv',
    name: 'MPV',
    description: 'A spacious people carrier for small groups with plenty of luggage.',
    exampleModels: 'Mercedes V Class, Tesla Model X, Mercedes Viano',
    passengers: 5,
    suitcases: 6,
    handLuggage: 5,
  },
  {
    slug: 'estate',
    name: 'Estate',
    description: 'A comfortable car with a larger boot for extra luggage.',
    exampleModels: 'MG5 EV, Toyota Auris, Tesla Model S',
    passengers: 3,
    suitcases: 4,
    handLuggage: 3,
  },
  {
    slug: 'mercedes-s-class',
    name: 'Mercedes S Class',
    description: 'Our most luxurious saloon, for special occasions and VIP travel.',
    exampleModels: 'Mercedes-Benz S Class',
    passengers: 4,
    suitcases: 3,
    handLuggage: 4,
  },
  {
    slug: 'saloon',
    name: 'Saloon',
    description: 'A standard four-door car for everyday journeys and airport runs.',
    exampleModels: 'Toyota Prius, Tesla Model 3, Mitsubishi Outlander',
    passengers: 4,
    suitcases: 3,
    handLuggage: 4,
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
