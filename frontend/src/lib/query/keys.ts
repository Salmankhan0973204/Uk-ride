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
};
