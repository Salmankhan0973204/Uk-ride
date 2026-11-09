/**
 * The fixed limits of one booked journey, as on ukride.uk. They are rules of
 * the product, not settings: the largest car seats eight, and the form offers
 * five stops.
 */
export const JOURNEY_LIMITS = {
  maxStops: 5,
  maxPassengers: 8,
  maxSuitcases: 8,
  maxHandLuggage: 8,
} as const;
