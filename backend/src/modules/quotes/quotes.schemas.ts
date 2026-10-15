import { z } from 'zod';
import { MAX_MILES } from './quote.calculator.js';

/** A form filled in a few minutes ago still counts as "now". */
const PAST_GRACE_MS = 10 * 60_000;
const MAX_AHEAD_MS = 365 * 24 * 60 * 60_000;

/**
 * Body of POST /quotes. The distance is typed in by hand for now; a map
 * will measure it in a later module.
 */
export const quoteRequestSchema = z.strictObject(
  {
    distanceMiles: z
      .number({
        error: (issue) =>
          issue.input === undefined ? 'Distance is required' : 'Distance must be a number of miles',
      })
      .min(0.1, 'Distance must be at least 0.1 miles')
      .max(MAX_MILES, `Distance must be at most ${MAX_MILES} miles`),
    // When the passenger is picked up, with its time zone: "2026-11-02T23:30:00Z"
    // or "2026-11-02T23:30:00+00:00". Without it, the quote is for now.
    pickupAt: z.iso
      .datetime({
        offset: true,
        error: 'Pick-up time must be a date and time, like 2026-11-02T23:30:00Z',
      })
      .transform((value) => new Date(value))
      .refine((date) => date.getTime() > Date.now() - PAST_GRACE_MS, {
        message: 'Pick-up time cannot be in the past',
      })
      .refine((date) => date.getTime() < Date.now() + MAX_AHEAD_MS, {
        message: 'Pick-up time must be within a year from now',
      })
      .optional(),
    airport: z.boolean('Airport must be true or false').default(false),
    // A vehicle type's slug. Without it, every vehicle type with prices is quoted.
    vehicleType: z.string().trim().toLowerCase().min(1).max(40).optional(),
  },
  'Send distanceMiles, and optionally pickupAt, airport and vehicleType',
);

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
