import { z } from 'zod';

/** Query of GET /places: what has been typed into an address box so far. */
export const placeSearchSchema = z.strictObject(
  {
    q: z
      .string('Type part of an address or a postcode')
      .trim()
      .min(2, 'Type at least 2 letters')
      .max(100, 'Type at most 100 characters'),
  },
  'Send only q, the text to search for',
);

export type PlaceSearch = z.infer<typeof placeSearchSchema>;
