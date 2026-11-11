import { randomInt } from 'node:crypto';

/**
 * Booking references, as on ukride.uk: "UKR-7F3K9Q".
 *
 * A reference is read out on the phone, typed by a dispatcher and printed on
 * receipts, so it is short and hard to misread:
 *
 *   - the digits 2 to 9 and consonants only: no 0 or O, no 1, I or L, which
 *     people mix up, and no vowels, so no real word can appear by chance;
 *   - six characters from 28: 481,890,304 references.
 *
 * It is random, not a counter. A counter would tell anyone how many bookings
 * there are and invite trying the next number. A reference is not a secret,
 * though: it is printed and emailed, so reading a booking always checks who
 * owns it as well.
 *
 * Two bookings can draw the same reference. The unique index on
 * `bookings.reference` refuses the second, and the booking is tried again
 * with new ones (bookings.service.ts).
 */
export const REFERENCE_ALPHABET = '23456789BCDFGHJKMNPQRSTVWXYZ';
export const REFERENCE_LENGTH = 6;
export const REFERENCE_PREFIX = 'UKR-';
export const REFERENCE_PATTERN = new RegExp(
  `^${REFERENCE_PREFIX}[${REFERENCE_ALPHABET}]{${REFERENCE_LENGTH}}$`,
);

/** A new random reference. `randomInt` is uniform: every character is equally likely. */
export function newReference() {
  let code = '';
  for (let index = 0; index < REFERENCE_LENGTH; index++) {
    code += REFERENCE_ALPHABET.charAt(randomInt(REFERENCE_ALPHABET.length));
  }
  return `${REFERENCE_PREFIX}${code}`;
}
