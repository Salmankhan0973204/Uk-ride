/**
 * Field checks shared by the forms. They mirror the API's rules, so most
 * mistakes are caught before a request is sent. The API still has the final
 * say, and its answers are shown on the same fields.
 */

export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 72;

// Letters from any alphabet, with spaces, hyphens, apostrophes and full stops inside.
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;

/** Why a name cannot be accepted, or undefined when it can. `label` is "first name" or "last name". */
export function checkName(value: string, label: string): string | undefined {
  const name = value.trim();
  if (!name) return `Enter your ${label}.`;
  if (name.length > 50) return `Use at most 50 characters for your ${label}.`;
  if (!NAME_PATTERN.test(name))
    return 'Use letters only. Spaces, hyphens and apostrophes are fine.';
}

/** Why a newly chosen password cannot be accepted, or undefined when it can. */
export function checkNewPassword(value: string, empty = 'Enter a password.'): string | undefined {
  if (!value) return empty;
  if (value.length < MIN_PASSWORD)
    return `Use at least ${MIN_PASSWORD} characters. You have ${value.length}.`;
  if (value.length > MAX_PASSWORD) return `Use at most ${MAX_PASSWORD} characters.`;
}
