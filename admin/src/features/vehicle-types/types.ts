/** A vehicle type as a customer sees it: GET /api/v1/vehicle-types. */
export interface VehicleType {
  id: string;
  /** Short, stable name used in addresses, for example "executive". */
  slug: string;
  name: string;
  description: string;
  /** Shown as "Cars like ... or similar". Empty when not set. */
  exampleModels: string;
  passengers: number;
  suitcases: number;
  handLuggage: number;
  /** The address of a picture hosted elsewhere, or null for none. */
  imageUrl: string | null;
}

/** A vehicle type as an admin sees it: GET /api/v1/admin/vehicle-types. */
export interface AdminVehicleType extends VehicleType {
  /** Lower numbers are listed first. */
  sortOrder: number;
  /** false when it is switched off and hidden from customers. */
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Body of POST /api/v1/admin/vehicle-types. Numbers are real numbers, not text. */
export interface NewVehicleType {
  name: string;
  /** Left out: the API makes it from the name. */
  slug?: string;
  description: string;
  exampleModels?: string;
  passengers: number;
  suitcases: number;
  handLuggage?: number;
  imageUrl?: string | null;
  /** Left out: the type goes to the end of the list. */
  sortOrder?: number;
}

/** Body of PATCH /api/v1/admin/vehicle-types/:id. Send only the fields to change. */
export type VehicleTypeChanges = Partial<
  Pick<
    AdminVehicleType,
    | 'name'
    | 'description'
    | 'exampleModels'
    | 'passengers'
    | 'suitcases'
    | 'handLuggage'
    | 'imageUrl'
    | 'sortOrder'
    | 'isActive'
  >
>;
