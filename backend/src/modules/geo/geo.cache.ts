/**
 * A small in-memory cache for answers from the outside services.
 *
 * Postcodes do not move and roads change slowly, so the same question asked
 * again is answered from memory: faster for the customer, and polite to free
 * services that ask not to be called more than needed. Entries expire after
 * a day, and the oldest is dropped when the cache is full.
 */
export class TtlCache<T> {
  private readonly entries = new Map<string, { value: T; expiresAt: number }>();

  constructor(
    private readonly ttlMs = 24 * 60 * 60_000,
    private readonly maxEntries = 2_000,
  ) {}

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T) {
    // A Map keeps insertion order, so the first key is the oldest.
    if (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}
