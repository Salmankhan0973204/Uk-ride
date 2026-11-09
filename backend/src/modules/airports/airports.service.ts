import { prisma } from '../../config/db.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../shared/AppError.js';
import { findPostcode } from '../geo/geo.postcodes.js';
import type { CreateAirportInput, UpdateAirportInput } from './airports.schemas.js';

/** What the quote and the address search need of an airport. */
export const airportSelect = {
  id: true,
  code: true,
  name: true,
  postcode: true,
  latitude: true,
  longitude: true,
  postcodes: true,
} satisfies Prisma.AirportSelect;

/** What an admin sees: the same, plus what is needed to manage the list. */
export const adminAirportSelect = {
  ...airportSelect,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AirportSelect;

export type ServedAirport = Prisma.AirportGetPayload<{ select: typeof airportSelect }>;

const order = [{ sortOrder: 'asc' as const }, { name: 'asc' as const }];

/** The airports on offer, in list order. Few rows, so they are read whole each time. */
export function listServedAirports(): Promise<ServedAirport[]> {
  return prisma.airport.findMany({
    where: { isActive: true },
    orderBy: order,
    select: airportSelect,
  });
}

/** Every airport, switched off or not. */
export function listAllAirports() {
  return prisma.airport.findMany({ orderBy: order, select: adminAirportSelect });
}

const noSuchAirport = () => AppError.notFound('There is no such airport');

const codeTaken = () =>
  AppError.conflict('Another airport already uses this code', { field: 'code' });

const isPrismaError = (err: unknown, code: string) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === code;

/** The map position of the main postcode. An unknown postcode is a 400 on that field. */
async function positionOf(postcode: string) {
  const { latitude, longitude } = await findPostcode(postcode, 'postcode');
  return { latitude, longitude };
}

/** Adds an airport. Without a sort order it goes to the end of the list. */
export async function createAirport(input: CreateAirportInput) {
  const position = await positionOf(input.postcode);

  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const last = await prisma.airport.aggregate({ _max: { sortOrder: true } });
    sortOrder = (last._max.sortOrder ?? 0) + 10;
  }

  try {
    return await prisma.airport.create({
      data: { ...input, ...position, sortOrder },
      select: adminAirportSelect,
    });
  } catch (err) {
    if (isPrismaError(err, 'P2002')) throw codeTaken();
    throw err;
  }
}

/** Changes the fields that were sent. A new main postcode moves the airport on the map. */
export async function updateAirport(id: string, changes: UpdateAirportInput) {
  const position = changes.postcode ? await positionOf(changes.postcode) : {};

  try {
    return await prisma.airport.update({
      where: { id },
      data: { ...changes, ...position },
      select: adminAirportSelect,
    });
  } catch (err) {
    if (isPrismaError(err, 'P2025')) throw noSuchAirport();
    if (isPrismaError(err, 'P2002')) throw codeTaken();
    throw err;
  }
}
