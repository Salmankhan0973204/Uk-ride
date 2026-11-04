/** An airport as an admin sees it: GET /api/v1/admin/airports. */
export interface AdminAirport {
  id: string;
  /** The three-letter IATA code: "LHR". */
  code: string;
  name: string;
  /** The main terminal's postcode. The map position below is looked up from it. */
  postcode: string;
  latitude: number;
  longitude: number;
  /** Other postcodes that count as this airport: whole ones, districts ("TW6") or sectors ("RH6 0"). */
  postcodes: string[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Body of POST /api/v1/admin/airports. */
export interface NewAirport {
  code: string;
  name: string;
  postcode: string;
  postcodes: string[];
  /** Left out: the airport goes to the end of the list. */
  sortOrder?: number;
}

/** Body of PATCH /api/v1/admin/airports/:id. Send only the fields to change. */
export type AirportChanges = Partial<
  Pick<AdminAirport, 'code' | 'name' | 'postcode' | 'postcodes' | 'sortOrder' | 'isActive'>
>;
