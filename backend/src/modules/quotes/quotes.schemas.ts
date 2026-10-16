import { z } from 'zod';
import { normalisePostcode } from '../geo/geo.postcodes.js';
import { MAX_MILES } from './quote.calculator.js';

/** A form filled in a few minutes ago still counts as "now". */
const PAST_GRACE_MS = 10 * 60_000;
const MAX_AHEAD_MS = 365 * 24 * 60 * 60_000;

/** A UK postcode, cleaned to its printed form: "sw1a1aa" → "SW1A 1AA". */
const postcode = (label: string) =>
  z.string(`${label} must be text`).transform((value, ctx) => {
    const clean = normalisePostcode(value);
    if (!clean) {
      ctx.issues.push({
        code: 'custom',
        message: value.trim()
          ? `${label} is not a UK postcode, like SW1A 1AA`
          : `${label} is required`,
        input: value,
      });
      return z.NEVER;
    }
    return clean;
  });

/**
 * Body of POST /quotes. The journey is given one of two ways:
 *
 * - pickupPostcode and dropoffPostcode: the road distance between them is
 *   measured. This is how customers ask.
 * - distanceMiles: a distance typed in by hand. Kept for admins checking
 *   their prices, and for when the map services are down.
 */
export const quoteRequestSchema = z
  .strictObject(
    {
      pickupPostcode: postcode('Pick-up postcode').optional(),
      dropoffPostcode: postcode('Drop-off postcode').optional(),
      distanceMiles: z
        .number('Distance must be a number of miles')
        .min(0.1, 'Distance must be at least 0.1 miles')
        .max(MAX_MILES, `Distance must be at most ${MAX_MILES} miles`)
        .optional(),
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
    'Send pickupPostcode and dropoffPostcode (or distanceMiles), and optionally pickupAt, airport and vehicleType',
  )
  .superRefine((body, ctx) => {
    const byPostcode = body.pickupPostcode !== undefined || body.dropoffPostcode !== undefined;
    if (byPostcode && body.distanceMiles !== undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Send postcodes or a distance, not both',
        path: ['distanceMiles'],
      });
      return;
    }
    if (!byPostcode && body.distanceMiles === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Pick-up postcode is required',
        path: ['pickupPostcode'],
      });
      ctx.addIssue({
        code: 'custom',
        message: 'Drop-off postcode is required',
        path: ['dropoffPostcode'],
      });
      return;
    }
    if (byPostcode) {
      if (body.pickupPostcode === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: 'Pick-up postcode is required',
          path: ['pickupPostcode'],
        });
      }
      if (body.dropoffPostcode === undefined) {
        ctx.addIssue({
          code: 'custom',
          message: 'Drop-off postcode is required',
          path: ['dropoffPostcode'],
        });
      }
      if (body.pickupPostcode && body.pickupPostcode === body.dropoffPostcode) {
        ctx.addIssue({
          code: 'custom',
          message: 'The drop-off postcode is the same as the pick-up',
          path: ['dropoffPostcode'],
        });
      }
    }
  });

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
