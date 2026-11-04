import { z } from 'zod';
import { normalisePostcode } from '../geo/geo.postcodes.js';
import { normaliseAirportPostcode } from './airports.match.js';

/** The most postcodes one airport's list may hold. */
export const MAX_AIRPORT_POSTCODES = 30;

const name = z
  .string('Name is required')
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(60, 'Name must be at most 60 characters');

// "lhr" → "LHR".
const code = z
  .string('Code is required')
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, 'Code must be the three-letter airport code, like LHR');

/** The main postcode: a whole one, since it says where the airport is on the map. */
const postcode = z.string('Main postcode is required').transform((value, ctx) => {
  const clean = normalisePostcode(value);
  if (!clean) {
    ctx.issues.push({
      code: 'custom',
      message: value.trim()
        ? 'Main postcode must be a whole UK postcode, like TW6 1EW'
        : 'Main postcode is required',
      input: value,
    });
    return z.NEVER;
  }
  return clean;
});

/**
 * The other postcodes that count as this airport. Each entry is tidied;
 * repeats are dropped. An empty list is allowed: then only the main
 * postcode counts.
 */
const postcodes = z
  .array(z.string('Each postcode must be text'), 'Postcodes must be a list')
  .max(MAX_AIRPORT_POSTCODES, `At most ${MAX_AIRPORT_POSTCODES} postcodes`)
  .transform((entries, ctx) => {
    const clean: string[] = [];
    for (const entry of entries) {
      const tidy = normaliseAirportPostcode(entry);
      if (!tidy) {
        ctx.issues.push({
          code: 'custom',
          message: `"${entry.trim()}" is not a postcode, a district like TW6 or a sector like RH6 0`,
          input: entry,
        });
        continue;
      }
      if (!clean.includes(tidy)) clean.push(tidy);
    }
    return clean;
  });

const sortOrder = z
  .number('Sort order must be a number')
  .int('Sort order must be a whole number')
  .min(0, 'Sort order must be at least 0')
  .max(9999, 'Sort order must be at most 9999');

export const createAirportSchema = z.strictObject(
  {
    code,
    name,
    postcode,
    postcodes: postcodes.default([]),
    sortOrder: sortOrder.optional(),
  },
  'Send code, name, postcode, and optionally postcodes and sortOrder',
);

/** A partial update. The map position follows the main postcode; it is never sent. */
export const updateAirportSchema = z
  .strictObject(
    {
      code: code.optional(),
      name: name.optional(),
      postcode: postcode.optional(),
      postcodes: postcodes.optional(),
      sortOrder: sortOrder.optional(),
      isActive: z.boolean('isActive must be true or false').optional(),
    },
    'Only code, name, postcode, postcodes, sortOrder and isActive can be changed',
  )
  .refine((changes) => Object.keys(changes).length > 0, 'Nothing to update');

export type CreateAirportInput = z.infer<typeof createAirportSchema>;
export type UpdateAirportInput = z.infer<typeof updateAirportSchema>;
