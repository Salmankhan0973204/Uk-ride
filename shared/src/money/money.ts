/**
 * Money on screen. The API works in whole pence; people read and type pounds.
 * These turn one into the other without ever doing arithmetic on decimals:
 * "3.50" is read as the digits 3 and 50, never as the number 3.5.
 */

/** 1250 → "£12.50". */
export function formatPence(pence: number) {
  const pounds = Math.floor(pence / 100);
  const rest = String(pence % 100).padStart(2, '0');
  return `£${pounds.toLocaleString('en-GB')}.${rest}`;
}

/** 1250 → "12.50", for putting an amount back into an input. */
export function penceToPounds(pence: number) {
  return `${Math.floor(pence / 100)}.${String(pence % 100).padStart(2, '0')}`;
}

/**
 * What someone typed as pounds, in pence, or undefined when it is not an
 * amount. "£3.50", "3.5", "3" and "1,250.00" are all accepted; "3.505" is not,
 * because there is no half a penny.
 */
export function parsePounds(text: string): number | undefined {
  const cleaned = text.trim().replace(/^£/, '').replace(/,/g, '');
  const match = /^(\d{1,6})(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) return undefined;

  const [, pounds, pence = ''] = match;
  // "3.5" means 3 pounds 50 pence, so the pence are padded on the right.
  return Number(pounds) * 100 + Number(pence.padEnd(2, '0'));
}
