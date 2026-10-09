import { prisma } from '../../config/db.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../shared/AppError.js';
import type { CreateVehicleTypeInput, UpdateVehicleTypeInput } from './vehicle-types.schemas.js';
import { adminVehicleType, publicVehicleType } from './vehicle-types.select.js';

const noSuchType = () => AppError.notFound('There is no such vehicle type');

/** The catalogue: every vehicle type on offer, in list order. */
export function listVehicleTypes() {
  return prisma.vehicleType.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: publicVehicleType,
  });
}

/**
 * One vehicle type by its slug.
 *
 * A type that was switched off answers 404, the same as one that never
 * existed: to a customer it is not on offer, and the answer should not
 * reveal what is kept in the back office.
 */
export async function getVehicleType(slug: string) {
  const vehicleType = await prisma.vehicleType.findFirst({
    where: { slug, isActive: true },
    select: publicVehicleType,
  });

  if (!vehicleType) throw noSuchType();
  return vehicleType;
}

/** Every vehicle type, switched off or not, with the fields needed to manage them. */
export function listAllVehicleTypes() {
  return prisma.vehicleType.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: adminVehicleType,
  });
}

const slugTaken = () =>
  AppError.conflict('Another vehicle type already uses this slug', { field: 'slug' });

const isPrismaError = (err: unknown, code: string) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === code;

/** "People carrier (6 seats)" becomes "people-carrier-6-seats". */
function slugFromName(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Adds a vehicle type. Without a sort order it goes to the end of the list.
 *
 * The unique index on `slug` is what really prevents a duplicate; the
 * `P2002` it raises is turned into a 409 that names the field.
 */
export async function createVehicleType(input: CreateVehicleTypeInput) {
  const slug = input.slug ?? slugFromName(input.name);
  if (slug.length < 2) {
    throw AppError.validation({
      slug: ['A slug could not be made from this name. Send a slug'],
    });
  }

  let sortOrder = input.sortOrder;
  if (sortOrder === undefined) {
    const last = await prisma.vehicleType.aggregate({ _max: { sortOrder: true } });
    sortOrder = (last._max.sortOrder ?? 0) + 10;
  }

  try {
    return await prisma.vehicleType.create({
      data: { ...input, slug, sortOrder },
      select: adminVehicleType,
    });
  } catch (err) {
    if (isPrismaError(err, 'P2002')) throw slugTaken();
    throw err;
  }
}

/** Changes the fields that were sent and leaves the rest alone. */
export async function updateVehicleType(id: string, changes: UpdateVehicleTypeInput) {
  try {
    return await prisma.vehicleType.update({
      where: { id },
      data: changes,
      select: adminVehicleType,
    });
  } catch (err) {
    // No row has this id.
    if (isPrismaError(err, 'P2025')) throw noSuchType();
    throw err;
  }
}

/**
 * Takes a vehicle type off the catalogue without deleting it: a soft delete.
 * The row stays, so anything that points at it (cars, bookings, later on)
 * keeps working. Doing it twice is harmless.
 */
export function deactivateVehicleType(id: string) {
  return updateVehicleType(id, { isActive: false });
}
