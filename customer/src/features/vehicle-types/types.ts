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
