import { z } from 'zod';
import { JOURNEY_LIMITS } from './journey.limits.js';

const MAX_AHEAD_MS = 365 * 24 * 60 * 60_000;

/**
 * One address, as picked from the address search (GET /places): the words
 * the customer saw, and the map position. The postcode and the airport are
 * worked out again on the server from the position, never taken from here.
 */
const place = (label: string) =>
  z.strictObject(
    {
      label: z
        .string(`${label}: the address is required`)
        .trim()
        .min(1, `${label}: the address is required`)
        .max(200, `${label}: the address must be at most 200 characters`),
      latitude: z
        .number(`${label}: latitude must be a number`)
        .min(-90, `${label}: latitude must be from -90 to 90`)
        .max(90, `${label}: latitude must be from -90 to 90`),
      longitude: z
        .number(`${label}: longitude must be a number`)
        .min(-180, `${label}: longitude must be from -180 to 180`)
        .max(180, `${label}: longitude must be from -180 to 180`),
    },
    `${label}: send label, latitude and longitude, as from GET /places`,
  );

/** A moment with its time zone: "2026-11-02T23:30:00Z". Not in the past, within a year. */
const moment = (label: string) =>
  z.iso
    .datetime({
      offset: true,
      error: `${label} must be a date and time, like 2026-11-02T23:30:00Z`,
    })
    .transform((value) => new Date(value))
    .refine((date) => date.getTime() > Date.now(), { message: `${label} cannot be in the past` })
    .refine((date) => date.getTime() < Date.now() + MAX_AHEAD_MS, {
      message: `${label} must be within a year from now`,
    });

const count = (label: string, min: number, max: number) =>
  z
    .number(`${label} must be a number`)
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);

/**
 * Body of POST /quotes: the "BOOK YOUR JOURNEY" form.
 *
 * The rules that need the database or the map (how far ahead to book,
 * whether an address is in the UK, the same place twice) are checked in the
 * service; here are the ones the body alone can answer.
 */
export const quoteRequestSchema = z
  .strictObject(
    {
      pickup: place('Pick-up'),
      dropoff: place('Drop-off'),
      // In the order they are driven to. The return runs them backwards.
      stops: z
        .array(place('Stop'), 'Stops must be a list')
        .max(JOURNEY_LIMITS.maxStops, `At most ${JOURNEY_LIMITS.maxStops} stops`)
        .default([]),
      pickupAt: moment('Pick-up time'),
      // With it, the trip is a return: a second leg from the drop-off back to the pick-up.
      returnAt: moment('Return time').optional(),
      passengers: count('Passengers', 1, JOURNEY_LIMITS.maxPassengers),
      suitcases: count('Suitcases', 0, JOURNEY_LIMITS.maxSuitcases).default(0),
      handLuggage: count('Hand luggage', 0, JOURNEY_LIMITS.maxHandLuggage).default(0),
    },
    'Send pickup, dropoff, pickupAt and passengers, and optionally stops, returnAt, suitcases and handLuggage',
  )
  .superRefine((body, ctx) => {
    if (body.returnAt && body.returnAt.getTime() <= body.pickupAt.getTime()) {
      ctx.addIssue({
        code: 'custom',
        message: 'The return must be after the pick-up',
        path: ['returnAt'],
      });
    }
  });

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type QuotePlace = QuoteRequest['pickup'];
