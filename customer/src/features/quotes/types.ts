import type { VehicleType } from '@/features/vehicle-types/types';

/** Body of POST /api/v1/quotes. */
export interface QuoteRequest {
  /** UK postcodes; the road distance between them is measured. */
  pickupPostcode: string;
  dropoffPostcode: string;
  /** An exact moment with its zone, "2026-11-02T23:30:00.000Z". Left out: now. */
  pickupAt?: string;
  airport: boolean;
}

export interface QuoteLine {
  code: 'BASE_FARE' | 'DISTANCE' | 'MINIMUM_FARE_TOP_UP' | 'NIGHT_SURCHARGE' | 'AIRPORT_FEE';
  label: string;
  amountPence: number;
}

/** The answer: one priced option per vehicle type. */
export interface QuoteResult {
  distanceMiles: number;
  chargedMiles: number;
  pickupAt: string;
  /** The measured route. Null only when a distance was typed in instead. */
  route: {
    pickup: { postcode: string; district: string };
    dropoff: { postcode: string; district: string };
    distanceMiles: number;
    durationMinutes: number;
  } | null;
  night: boolean;
  airport: boolean;
  currency: 'GBP';
  quotes: { vehicleType: VehicleType; lines: QuoteLine[]; totalPence: number }[];
}
