export const VEHICLE_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'MAINTENANCE', label: 'In maintenance' },
  { value: 'RETIRED', label: 'Retired' },
] as const;

export type VehicleStatus = (typeof VEHICLE_STATUSES)[number]['value'];

/** A vehicle as GET /api/v1/admin/vehicles returns it. */
export interface Vehicle {
  id: string;
  /** Capitals, no spaces: "AB12CDE". Use formatRegistration() to show it. */
  registration: string;
  make: string;
  model: string;
  colour: string;
  year: number;
  status: VehicleStatus;
  vehicleType: { id: string; slug: string; name: string; isActive: boolean };
  createdAt: string;
  updatedAt: string;
}

/** What the list can be asked for. Everything is optional. */
export interface VehicleListQuery {
  page?: number;
  status?: VehicleStatus;
  /** A vehicle type's slug. */
  type?: string;
  search?: string;
}

/** The page numbers that come in `meta` beside a page of rows. */
export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Body of POST /api/v1/admin/vehicles. */
export interface NewVehicle {
  registration: string;
  make: string;
  model: string;
  colour: string;
  year: number;
  vehicleTypeId: string;
}

/** Body of PATCH /api/v1/admin/vehicles/:id. Send only the fields to change. */
export type VehicleChanges = Partial<NewVehicle>;
