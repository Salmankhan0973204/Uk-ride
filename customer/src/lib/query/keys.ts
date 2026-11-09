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
  booking: {
    all: ['booking'] as const,
    config: () => [...queryKeys.booking.all, 'config'] as const,
    places: (text: string) => [...queryKeys.booking.all, 'places', text] as const,
    // One entry per journey: the address of /booking.
    quote: (journey: string) => [...queryKeys.booking.all, 'quote', journey] as const,
  },
};
