import { encodeBase62 } from './base62.js';

/**
 * Derives a short code from a PostgreSQL autoincrement ID.
 *
 * Architecture:
 * 1. Insert URL → DB assigns numeric `id`
 * 2. Convert `id` → Base62 short code
 * 3. Persist short code back onto the same row
 *
 * No random generators (nanoid, UUID, etc.) are used.
 *
 * @param id - Autoincrement primary key from PostgreSQL
 * @returns Deterministic Base62 short code for that ID
 *
 * @example
 * generateShortCode(1000) // => "g8"
 */
export function generateShortCode(id: number): string {
  return encodeBase62(id);
}
