import type { Prisma } from '../../generated/prisma/client.js';

/**
 * What a customer sees of a vehicle type. `isActive`, `sortOrder` and the
 * timestamps are for running the catalogue, not for choosing a car.
 */
export const publicVehicleType = {
  id: true,
  slug: true,
  name: true,
  description: true,
  passengers: true,
  suitcases: true,
} satisfies Prisma.VehicleTypeSelect;
