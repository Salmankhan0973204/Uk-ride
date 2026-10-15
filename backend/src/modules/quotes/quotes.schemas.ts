import { z } from 'zod';
import { MAX_MILES } from './quote.calculator.js';

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
    // A vehicle type's slug. Without it, every vehicle type with prices is quoted.
    vehicleType: z.string().trim().toLowerCase().min(1).max(40).optional(),
  },
  'Send distanceMiles, and optionally vehicleType',
);

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
