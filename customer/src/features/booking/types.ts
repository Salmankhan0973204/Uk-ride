import type { VehicleType } from '@/features/vehicle-types/types';

/** One of our airports, as the API names it. */
export interface AirportRef {
  code: string;
  name: string;
}

/** One suggestion under an address box: GET /api/v1/places. */
export interface PlaceSuggestion {
  label: string;
  /** The second line. Empty when there is nothing to add. */
  detail: string;
  latitude: number;
  longitude: number;
  postcode: string | null;
  kind: 'airport' | 'postcode' | 'address';
  airport: AirportRef | null;
}

/** An address the customer picked: the words they saw, and where it is. */
export interface JourneyPlace {
  label: string;
  latitude: number;
  longitude: number;
}

/** The "BOOK YOUR JOURNEY" form, as it travels in the address of /booking. */
export interface Journey {
  pickup: JourneyPlace;
  stops: JourneyPlace[];
  dropoff: JourneyPlace;
  /** UK time, as the boxes hold it: "2026-11-20" and "12:30". */
  date: string;
  time: string;
  /** Present for a return journey. */
  returnDate?: string;
  returnTime?: string;
  passengers: number;
  suitcases: number;
  handLuggage: number;
}

/** GET /api/v1/config. */
export interface BookingConfig {
  currency: 'GBP';
  meetGreetPence: number;
  bookingLeadMinutes: number;
  editCutoffMinutes: number;
  unpaidExpiryMinutes: number;
  driverDetailsMinutes: number;
  quoteValidMinutes: number;
  limits: {
    maxStops: number;
    maxPassengers: number;
    maxSuitcases: number;
    maxHandLuggage: number;
  };
}

/** Body of POST /api/v1/quotes. */
export interface QuoteRequest {
  pickup: JourneyPlace;
  stops: JourneyPlace[];
  dropoff: JourneyPlace;
  /** Exact moments with their zone: "2026-11-20T12:30:00.000Z". */
  pickupAt: string;
  returnAt?: string;
  passengers: number;
  suitcases: number;
  handLuggage: number;
}

export interface QuoteLine {
  code:
    | 'BASE_FARE'
    | 'DISTANCE'
    | 'MINIMUM_FARE_TOP_UP'
    | 'NIGHT_SURCHARGE'
    | 'AIRPORT_FEE'
    | 'DISCOUNT'
    | 'MEET_AND_GREET';
  label: string;
  /** Negative for the discount. */
  amountPence: number;
}

export interface QuoteLeg {
  direction: 'OUTBOUND' | 'RETURN';
  pickupAt: string;
  /** In driving order: pick-up, stops, drop-off. */
  places: (JourneyPlace & { postcode: string; district: string; airport: AirportRef | null })[];
  distanceMiles: number;
  durationMinutes: number;
  chargedMiles: number;
  night: boolean;
  airport: boolean;
  /** Set when the leg starts at an airport: a flight number, and Meet & Greet on offer. */
  airportPickup: AirportRef | null;
}

export interface QuoteOption {
  vehicleType: VehicleType;
  fits: boolean;
  recommended: boolean;
  discountPercent: number;
  originalPence: number;
  discountPence: number;
  /** Every leg, without Meet & Greet. */
  pricePence: number;
  legs: { lines: QuoteLine[]; originalPence: number; discountPence: number; pricePence: number }[];
}

/** The answer of POST /api/v1/quotes. */
export interface QuoteResult {
  /** null when no prices are published yet; then there is nothing to book. */
  quoteId: string | null;
  expiresAt: string | null;
  currency: 'GBP';
  meetGreetPence: number;
  legs: QuoteLeg[];
  party: { passengers: number; suitcases: number; handLuggage: number };
  /** Cheapest first. */
  options: QuoteOption[];
  recommendedVehicleTypeId: string | null;
}
