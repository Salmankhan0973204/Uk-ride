import { prisma } from '../../config/db.js';
import { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../shared/AppError.js';
import type {
  CreateVehicleInput,
  ListVehiclesQuery,
  UpdateVehicleInput,
} from './vehicles.schemas.js';
import { vehicleSelect } from './vehicles.select.js';

const noSuchVehicle = () => AppError.notFound('There is no such vehicle');

const plateTaken = () =>
  AppError.conflict('Another vehicle already has this registration', { field: 'registration' });

const typeNotOnOffer = () =>
  AppError.validation({ vehicleTypeId: ['Choose a vehicle type that is on offer'] });

const isPrismaError = (err: unknown, code: string) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === code;

/**
 * A new car must belong to a type customers can book. A type that does not
 * exist, or was switched off, is refused on the field, with one message for
 * both: the admin's fix is the same, choose another type.
 */
async function checkTypeOnOffer(vehicleTypeId: string) {
  const type = await prisma.vehicleType.findUnique({
    where: { id: vehicleTypeId },
    select: { isActive: true },
  });
  if (!type?.isActive) throw typeNotOnOffer();
}

/** Turns the database's refusals into answers that name the field. */
function explain(err: unknown): never {
  // The unique index on registration.
  if (isPrismaError(err, 'P2002')) throw plateTaken();
  // The foreign key: the type was deleted between the check and the write.
  if (isPrismaError(err, 'P2003')) throw typeNotOnOffer();
  // No row has this id.
  if (isPrismaError(err, 'P2025')) throw noSuchVehicle();
  throw err;
}

/** One vehicle, with its type. */
export async function getVehicle(id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id }, select: vehicleSelect });
  if (!vehicle) throw noSuchVehicle();
  return vehicle;
}

/** Adds a car to the fleet. It starts ACTIVE. */
export async function createVehicle(input: CreateVehicleInput) {
  await checkTypeOnOffer(input.vehicleTypeId);
  try {
    return await prisma.vehicle.create({ data: input, select: vehicleSelect });
  } catch (err) {
    explain(err);
  }
}

/**
 * Changes the fields that were sent. Moving a car to another type needs that
 * type to be on offer; a car may keep a type that was switched off later.
 */
export async function updateVehicle(id: string, changes: UpdateVehicleInput) {
  if (changes.vehicleTypeId) await checkTypeOnOffer(changes.vehicleTypeId);
  try {
    return await prisma.vehicle.update({ where: { id }, data: changes, select: vehicleSelect });
  } catch (err) {
    explain(err);
  }
}

/**
 * One page of the fleet, filtered and searched, plus the numbers a client
 * needs to draw page links.
 *
 * The filters build one `where`. The same `where` goes to the count and to
 * the page itself, inside one transaction, so "12 vehicles, page 2 of 2" is
 * always true of the rows that come back.
 */
export async function listVehicles({ page, pageSize, status, type, search }: ListVehiclesQuery) {
  const where: Prisma.VehicleWhereInput = {
    ...(status ? { status } : {}),
    ...(type ? { vehicleType: { slug: type } } : {}),
    ...(search
      ? {
          OR: [
            // Plates are stored without spaces, so the search is cleaned the same way.
            { registration: { contains: search.replace(/\s+/g, '').toUpperCase() } },
            { make: { contains: search, mode: 'insensitive' } },
            { model: { contains: search, mode: 'insensitive' } },
            { colour: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, vehicles] = await prisma.$transaction([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
      where,
      // A stable order: without one, rows could move between pages.
      orderBy: [{ registration: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: vehicleSelect,
    }),
  ]);

  return {
    vehicles,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}
