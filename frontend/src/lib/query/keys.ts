/**
 * Central query-key factory.
 * Every hook takes its key from here so invalidation stays predictable.
 * New modules add their own section (auth, vehicles, quotes, bookings ...).
 */
export const queryKeys = {
  health: {
    all: ['health'] as const,
    status: () => [...queryKeys.health.all, 'status'] as const,
  },
};
