import { prisma } from '../../config/db.js';
import { JOURNEY_LIMITS } from '../quotes/journey.limits.js';
import type { SettingsInput } from './settings.schemas.js';

/** The one row's id. */
const ID = 1;

const settingsSelect = {
  meetGreetPence: true,
  bookingLeadMinutes: true,
  editCutoffMinutes: true,
  unpaidExpiryMinutes: true,
  driverDetailsMinutes: true,
  quoteValidMinutes: true,
  updatedAt: true,
} as const;

/**
 * The booking rules. The row is created with the schema's defaults the first
 * time anyone asks, so a fresh database works without a seed. `upsert` with
 * an empty update does that in one statement, even with two first readers.
 */
export function getSettings() {
  return prisma.settings.upsert({
    where: { id: ID },
    create: { id: ID },
    update: {},
    select: settingsSelect,
  });
}

/** Replaces every setting. */
export function setSettings(input: SettingsInput) {
  return prisma.settings.upsert({
    where: { id: ID },
    create: { id: ID, ...input },
    update: input,
    select: settingsSelect,
  });
}

/**
 * What the customer site needs to know before it asks for anything: what
 * Meet & Greet costs, how far ahead to book, and the size of a journey.
 * Every rule is still checked again on the server.
 */
export async function publicConfig() {
  const settings = await getSettings();
  return {
    currency: 'GBP' as const,
    meetGreetPence: settings.meetGreetPence,
    bookingLeadMinutes: settings.bookingLeadMinutes,
    editCutoffMinutes: settings.editCutoffMinutes,
    unpaidExpiryMinutes: settings.unpaidExpiryMinutes,
    driverDetailsMinutes: settings.driverDetailsMinutes,
    quoteValidMinutes: settings.quoteValidMinutes,
    limits: JOURNEY_LIMITS,
  };
}
