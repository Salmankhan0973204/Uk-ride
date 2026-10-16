/**
 * Central query-key factory.
 * Every hook takes its key from here so invalidation stays predictable.
 * New modules add their own section (vehicles, quotes, bookings ...).
 */
export const queryKeys = {
  health: {
    all: ['health'] as const,
    status: () => [...queryKeys.health.all, 'status'] as const,
    readiness: () => [...queryKeys.health.all, 'readiness'] as const,
  },
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  vehicleTypes: {
    // Invalidating `all` refreshes every list below it: public and admin.
    all: ['vehicleTypes'] as const,
    list: () => [...queryKeys.vehicleTypes.all, 'list'] as const,
    admin: () => [...queryKeys.vehicleTypes.all, 'admin'] as const,
  },
  vehicles: {
    all: ['vehicles'] as const,
    // Each page and filter is its own cache entry.
    list: (query: object) => [...queryKeys.vehicles.all, 'list', query] as const,
    detail: (id: string) => [...queryKeys.vehicles.all, 'detail', id] as const,
  },
  pricing: {
    all: ['pricing'] as const,
    list: () => [...queryKeys.pricing.all, 'list'] as const,
  },
  quotes: {
    all: ['quotes'] as const,
  },
};
