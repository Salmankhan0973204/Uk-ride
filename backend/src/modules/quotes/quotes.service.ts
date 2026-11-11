import { prisma } from '../../config/db.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../../shared/AppError.js';
import { airportFor } from '../airports/airports.match.js';
import { listServedAirports } from '../airports/airports.service.js';
import type { ServedAirport } from '../airports/airports.service.js';
import { metresBetween } from '../geo/geo.places.js';
import { nearestPostcode } from '../geo/geo.postcodes.js';
import { findRoadRoute } from '../geo/geo.routing.js';
import { getSettings } from '../settings/settings.service.js';
import { publicVehicleType } from '../vehicle-types/vehicle-types.select.js';
import {
  MAX_MILES,
  chargedMilesFor,
  fits,
  isNight,
  priceTrip,
  recommend,
} from './quote.calculator.js';
import type { Leg } from './quote.calculator.js';
import { readSavedQuote } from './quote.saved.js';
import type { QuotePlace, QuoteRequest } from './quotes.schemas.js';

/** Two addresses closer than this are one place: a journey from a door to itself. */
const SAME_PLACE_METRES = 100;
/** The shortest leg worth pricing; the engine charges in tenths of a mile. */
const SHORTEST_MILES = 0.1;

type Direction = 'OUTBOUND' | 'RETURN';

/** An address after the server has looked at it: its postcode, and its airport if any. */
interface LocatedPlace {
  label: string;
  latitude: number;
  longitude: number;
  postcode: string;
  district: string;
  airport: { code: string; name: string } | null;
}

/** "240" → "4 hours", "90" → "90 minutes". */
function inWords(minutes: number) {
  if (minutes % 60 !== 0) return `${minutes} minutes`;
  const hours = minutes / 60;
  return hours === 1 ? '1 hour' : `${hours} hours`;
}

/**
 * Finds the postcode of every address at the same time, and with it the
 * airport. An address with no UK postcode within 2 km cannot be served;
 * every such address is reported at once, on its own field.
 */
async function locate(
  places: { field: string; name: string; place: QuotePlace }[],
  airports: readonly ServedAirport[],
) {
  const found = await Promise.all(
    places.map(({ place }) => nearestPostcode(place.latitude, place.longitude)),
  );

  const problems: Record<string, string[]> = {};
  const located = places.map(({ field, name, place }, index): LocatedPlace | undefined => {
    const postcode = found[index];
    if (!postcode) {
      (problems[field] ??= []).push(
        `${name}: we could not find this address in the UK. Choose another`,
      );
      return undefined;
    }
    const airport = airportFor(postcode.postcode, airports);
    return {
      label: place.label,
      latitude: place.latitude,
      longitude: place.longitude,
      postcode: postcode.postcode,
      district: postcode.district,
      airport: airport ? { code: airport.code, name: airport.name } : null,
    };
  });

  if (Object.keys(problems).length > 0) throw AppError.validation(problems);
  return located as LocatedPlace[];
}

/**
 * Prices a journey in every class on offer that has prices, and saves the
 * answer as a quote that can be booked until it expires.
 *
 * The outer layer: it checks the rules that need the clock, the settings or
 * the map, measures each leg by road, and hands the numbers to the pure
 * engine in quote.calculator.ts, where all the arithmetic is.
 */
export async function quoteJourney(request: QuoteRequest) {
  // The clock is read here, in the outer layer, never inside the engine.
  const now = Date.now();
  const settings = await getSettings();

  if (request.pickupAt.getTime() < now + settings.bookingLeadMinutes * 60_000) {
    throw AppError.validation({
      pickupAt: [`Book at least ${inWords(settings.bookingLeadMinutes)} ahead`],
    });
  }
  if (metresBetween(request.pickup, request.dropoff) < SAME_PLACE_METRES) {
    throw AppError.validation({ dropoff: ['The drop-off is the same place as the pick-up'] });
  }

  const airports = await listServedAirports();
  const [pickup, ...rest] = await locate(
    [
      { field: 'pickup', name: 'Pick-up', place: request.pickup },
      ...request.stops.map((place, index) => ({
        field: 'stops',
        name: `Stop ${index + 1}`,
        place,
      })),
      { field: 'dropoff', name: 'Drop-off', place: request.dropoff },
    ],
    airports,
  );
  const dropoff = rest.pop()!;
  const outboundPlaces = [pickup!, ...rest, dropoff];

  // The return runs the stops backwards, from the drop-off to the pick-up.
  const plan: { direction: Direction; pickupAt: Date; places: LocatedPlace[] }[] = [
    { direction: 'OUTBOUND', pickupAt: request.pickupAt, places: outboundPlaces },
  ];
  if (request.returnAt) {
    plan.push({
      direction: 'RETURN',
      pickupAt: request.returnAt,
      places: [...outboundPlaces].reverse(),
    });
  }

  // One-way streets make the two directions differ, so each is measured.
  const routes = await Promise.all(plan.map((leg) => findRoadRoute(leg.places)));
  if (routes.some((route) => route.distanceMiles < SHORTEST_MILES)) {
    throw AppError.validation({
      dropoff: ['These places are too close together to price a journey'],
    });
  }
  // The engine refuses a leg this long; said here, on the field, not as a 500.
  if (routes.some((route) => route.distanceMiles > MAX_MILES)) {
    throw AppError.validation({ dropoff: ['This journey is too long to book online'] });
  }

  const legs = plan.map((leg, index) => {
    const route = routes[index]!;
    const first = leg.places[0]!;
    return {
      direction: leg.direction,
      pickupAt: leg.pickupAt.toISOString(),
      places: leg.places,
      distanceMiles: route.distanceMiles,
      durationMinutes: route.durationMinutes,
      chargedMiles: chargedMilesFor(route.distanceMiles),
      night: isNight(leg.pickupAt),
      // Any airport on the leg: the airport fee.
      airport: leg.places.some((place) => place.airport !== null),
      // Picked up at an airport: a flight number is needed, and Meet & Greet is offered.
      airportPickup: first.airport,
    };
  });

  // Meet & Greet is chosen on the booking page, so the prices here are
  // without it; `meetGreetPence` says what it adds to a leg.
  const engineLegs: Leg[] = legs.map((leg) => ({
    distanceMiles: leg.distanceMiles,
    pickupAt: new Date(leg.pickupAt),
    airport: leg.airport,
    airportPickup: leg.airportPickup !== null,
    meetGreet: false,
  }));

  const types = await prisma.vehicleType.findMany({
    where: { isActive: true, pricingRule: { isNot: null } },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { ...publicVehicleType, pricingRule: true },
  });

  const party = {
    passengers: request.passengers,
    suitcases: request.suitcases,
    handLuggage: request.handLuggage,
  };

  // The fleet's list order starts with the 8 Seater, which is no answer for
  // two people. The booking page lists the classes cheapest first instead
  // (the list order breaks a tie), so "the first class that fits" is the
  // cheapest class that fits.
  const priced = types
    .map(({ pricingRule, ...vehicleType }) => ({
      vehicleType,
      // The query only returns types that have a rule.
      rule: pricingRule!,
      trip: priceTrip(pricingRule!, engineLegs, { meetGreetPence: settings.meetGreetPence }),
    }))
    .sort((a, b) => a.trip.farePence - b.trip.farePence);
  const recommended = recommend(
    priced.map((option) => option.vehicleType),
    party,
  );

  const options = priced.map(({ vehicleType, rule, trip }) => {
    return {
      vehicleType,
      fits: fits(vehicleType, party),
      recommended: vehicleType.id === recommended?.id,
      discountPercent: rule.discountPercent,
      originalPence: trip.originalPence,
      discountPence: trip.discountPence,
      pricePence: trip.farePence,
      legs: trip.legs.map((leg) => ({
        lines: leg.lines,
        originalPence: leg.originalPence,
        discountPence: leg.discountPence,
        pricePence: leg.farePence,
      })),
    };
  });

  const journey = { legs, party };
  const answer = {
    currency: 'GBP' as const,
    meetGreetPence: settings.meetGreetPence,
    ...journey,
    options,
    recommendedVehicleTypeId: recommended?.id ?? null,
  };

  // Nothing to book: no class has prices yet. The journey is still shown.
  if (options.length === 0) return { quoteId: null, expiresAt: null, ...answer };

  const saved = await prisma.quote.create({
    data: {
      journey: journey as unknown as Prisma.InputJsonValue,
      options: options as unknown as Prisma.InputJsonValue,
      meetGreetPence: settings.meetGreetPence,
      // The hold, cut short when the pick-up comes within the booking lead
      // time: "held until" on the page is then the real booking deadline.
      expiresAt: bookableUntil(
        new Date(now + settings.quoteValidMinutes * 60_000),
        request.pickupAt,
        settings.bookingLeadMinutes,
      ),
    },
    select: { id: true, expiresAt: true },
  });

  return { quoteId: saved.id, expiresAt: saved.expiresAt.toISOString(), ...answer };
}

/**
 * The last moment something with this first pick-up can still be booked,
 * given a limit of its own (a quote's hold, an unpaid booking's grace): the
 * earlier of that limit and the moment the pick-up comes within the booking
 * lead time. Nothing may be booked, or paid for, with less notice than the
 * operator asks for.
 */
export function bookableUntil(limit: Date, firstPickupAt: Date, leadMinutes: number) {
  return new Date(Math.min(limit.getTime(), firstPickupAt.getTime() - leadMinutes * 60_000));
}

/**
 * A saved quote that can still be booked: it exists, reads back in the shape
 * it was written, and neither its hold nor the booking lead time (as it is
 * now, not as it was) has run out. Expired rows stay in the table until the
 * clean-up job's next sweep, so the time is always checked here.
 */
export async function findBookableQuote(quoteId: string, now: Date, leadMinutes: number) {
  const row = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!row) return undefined;

  const quote = readSavedQuote(row);
  if (!quote) return undefined;

  const outbound = quote.journey.legs[0]!;
  if (now >= bookableUntil(quote.expiresAt, outbound.pickupAt, leadMinutes)) return undefined;

  return quote;
}

/** Removes quotes that have run out. Run by the clean-up job. */
export async function deleteExpiredQuotes(now = new Date()) {
  const { count } = await prisma.quote.deleteMany({ where: { expiresAt: { lt: now } } });
  return count;
}
