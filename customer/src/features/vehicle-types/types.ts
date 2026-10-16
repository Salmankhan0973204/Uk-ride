/** A vehicle type as a customer sees it: GET /api/v1/vehicle-types. */
export interface VehicleType {
  id: string;
  /** Short, stable name used in addresses, for example "executive". */
  slug: string;
  name: string;
  description: string;
  passengers: number;
  suitcases: number;
}
