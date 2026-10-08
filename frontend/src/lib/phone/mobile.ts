import { parsePhoneNumberFromString } from 'libphonenumber-js';

/** "0044 (7400) 123-456" and "+44 7400 123456" both become "+447400123456". */
export function normaliseMobile(value: string) {
  return value.replace(/[\s().-]/g, '').replace(/^00/, '+');
}

/**
 * Why a mobile number cannot be accepted, or undefined when it can.
 * The same check as the API, so most mistakes never leave the browser. The API
 * has the final say (it also tells landlines from mobiles).
 */
export function checkMobile(value: string): string | undefined {
  const cleaned = normaliseMobile(value);
  if (!cleaned) return 'Enter your mobile number.';
  if (!cleaned.startsWith('+')) return 'Start with the country code, like +44 7400 123456.';
  if (!parsePhoneNumberFromString(cleaned)?.isValid())
    return 'That is not a valid number for its country. Check the digits.';
}

/** "+447400123456" shown as "+44 7400 123456". Falls back to the stored form. */
export function formatMobile(value: string) {
  return parsePhoneNumberFromString(value)?.formatInternational() ?? value;
}
