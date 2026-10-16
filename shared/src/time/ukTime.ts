/**
 * Times on the UK clock. Journeys happen in the UK, so a pick-up time is typed
 * and shown in UK time, whatever the time zone of the visitor's computer: a
 * customer booking from abroad for when they land types the time in London.
 *
 * The UK is on GMT in winter and BST (GMT+1) in summer.
 */
const UK = 'Europe/London';

/** How far UK time is ahead of UTC at that moment, in minutes: 0 or 60. */
function ukOffsetMinutes(moment: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: UK,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(moment);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return Math.round((asUtc - moment.getTime()) / 60_000);
}

/**
 * "2026-11-02T23:30", as typed in a date-and-time box, read as UK time and
 * turned into an exact moment. Undefined when the text is not a date and time.
 */
export function ukLocalToDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, year, month, day, hour, minute] = match.map(Number);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);

  // Guess with the offset at that moment, then correct once: around the
  // change between GMT and BST the first guess can be an hour out.
  const guess = asUtc - ukOffsetMinutes(new Date(asUtc)) * 60_000;
  return new Date(asUtc - ukOffsetMinutes(new Date(guess)) * 60_000);
}

/** "Mon 2 Nov, 23:30", on the UK clock. */
export function formatUkTime(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: UK,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}
