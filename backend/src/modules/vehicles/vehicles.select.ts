import type { Prisma } from '../../generated/prisma/client.js';

/**
 * A vehicle as an admin sees it. The vehicle type comes with it, so a list
 * can say "Executive" without a second request per row. Only the type's
 * short fields are taken: a relation can be selected like any column.
 */
export const vehicleSelect = {
  id: true,
  registration: true,
  make: true,
  model: true,
  colour: true,
  year: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  vehicleType: { select: { id: true, slug: true, name: true, isActive: true } },
} satisfies Prisma.VehicleSelect;
