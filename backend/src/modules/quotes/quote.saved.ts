import { z } from 'zod';
import { logger } from '../../config/logger.js';
import type { Quote } from '../../generated/prisma/client.js';
import { QUOTE_LINE_CODES } from './quote.calculator.js';

/**
 * A saved quote, read back for booking.
 *
 * quoteJourney() writes the `journey` and `options` columns as JSON. The
 * database cannot check their shape, so this file does, before a booking is
 * made from them: a row written by an older release, or a column edited by
 * hand, must never become a booking with a price that does not add up.
 *
 * The schemas are loose on purpose. Unknown fields are dropped, and a field
 * added later must be optional, so rows saved before it still read.
 */

const savedAirport = z.object({ code: z.string(), name: z.string() }).nullable();

const savedPlace = z.object({
  label: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  postcode: z.string(),
  district: z.string(),
  airport: savedAirport,
});

const savedLeg = z.object({
  direction: z.enum(['OUTBOUND', 'RETURN']),
  // Saved as text: "2026-11-20T09:00:00.000Z".
  pickupAt: z.iso.datetime().transform((value) => new Date(value)),
  // In driving order: at least a pick-up and a drop-off.
  places: z.array(savedPlace).min(2),
  distanceMiles: z.number().positive(),
  durationMinutes: z.number().int().nonnegative(),
  chargedMiles: z.number(),
  night: z.boolean(),
  airport: z.boolean(),
  airportPickup: savedAirport,
});

const savedLine = z.object({
  code: z.enum(QUOTE_LINE_CODES),
  label: z.string(),
  amountPence: z.number().int(),
});

const savedLegPrice = z.object({
  lines: z.array(savedLine),
  originalPence: z.number().int(),
  discountPence: z.number().int(),
  pricePence: z.number().int(),
});

const savedVehicleType = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  exampleModels: z.string(),
  passengers: z.number().int(),
  suitcases: z.number().int(),
  handLuggage: z.number().int(),
  imageUrl: z.string().nullable(),
});

const savedOption = z.object({
  vehicleType: savedVehicleType,
  fits: z.boolean(),
  recommended: z.boolean(),
  discountPercent: z.number().int(),
  originalPence: z.number().int(),
  discountPence: z.number().int(),
  pricePence: z.number().int(),
  // One entry per leg of the journey, in the same order.
  legs: z.array(savedLegPrice),
});

const savedJourney = z.object({
  // One way, or out and back.
  legs: z.array(savedLeg).min(1).max(2),
  party: z.object({
    passengers: z.number().int(),
    suitcases: z.number().int(),
    handLuggage: z.number().int(),
  }),
});

export type SavedPlace = z.infer<typeof savedPlace>;
export type SavedLeg = z.infer<typeof savedLeg>;
export type SavedJourney = z.infer<typeof savedJourney>;
export type SavedOption = z.infer<typeof savedOption>;

export interface SavedQuote {
  id: string;
  meetGreetPence: number;
  expiresAt: Date;
  journey: SavedJourney;
  options: SavedOption[];
}

/**
 * Reads a quote row back. Undefined, with a line in the log, when it is not
 * in the shape the writer makes; the caller then treats the quote as run out,
 * which costs the customer a new quote rather than a wrong booking.
 */
export function readSavedQuote(
  row: Pick<Quote, 'id' | 'journey' | 'options' | 'meetGreetPence' | 'expiresAt'>,
): SavedQuote | undefined {
  const journey = savedJourney.safeParse(row.journey);
  const options = z.array(savedOption).safeParse(row.options);

  const consistent =
    journey.success &&
    options.success &&
    options.data.every((option) => option.legs.length === journey.data.legs.length);

  if (!journey.success || !options.success || !consistent) {
    logger.error({ quoteId: row.id }, 'A saved quote is not in the shape the API writes');
    return undefined;
  }

  return {
    id: row.id,
    meetGreetPence: row.meetGreetPence,
    expiresAt: row.expiresAt,
    journey: journey.data,
    options: options.data,
  };
}
