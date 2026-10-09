import { prisma } from '../../config/db.js';
import { AppError } from '../../shared/AppError.js';
import { adminVehicleType, publicVehicleType } from './vehicle-types.select.js';

const noSuchType = () => AppError.notFound('There is no vehicle type with this name');

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
