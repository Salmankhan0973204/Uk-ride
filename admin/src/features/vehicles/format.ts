import { VEHICLE_STATUSES } from './types';
import type { VehicleStatus } from './types';

/**
 * Shows a stored plate the way it is printed. Current UK plates
 * ("AB12CDE") get their space back: "AB12 CDE". Other shapes, such as
 * private plates, are shown as they are.
 */
export function formatRegistration(registration: string) {
  return /^[A-Z]{2}\d{2}[A-Z]{3}$/.test(registration)
    ? `${registration.slice(0, 4)} ${registration.slice(4)}`
    : registration;
}

export const statusLabel = (status: VehicleStatus) =>
  VEHICLE_STATUSES.find((option) => option.value === status)?.label ?? status;
