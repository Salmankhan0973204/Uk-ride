/**
 * Central query-key factory of the customer site.
 * Every hook takes its key from here so invalidation stays predictable.
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },
  vehicleTypes: {
    all: ['vehicleTypes'] as const,
    list: () => [...queryKeys.vehicleTypes.all, 'list'] as const,
  },
  quotes: {
    all: ['quotes'] as const,
  },
};
