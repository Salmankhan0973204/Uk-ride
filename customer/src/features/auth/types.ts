export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const;

export type Gender = (typeof GENDER_OPTIONS)[number]['value'];

export type Role = 'CUSTOMER' | 'DRIVER' | 'DISPATCHER' | 'ADMIN';

/** Body of POST /api/v1/auth/register. */
export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  /** With the country code, for example "+44 7400 123456". */
  mobile: string;
  /** Left out when the customer does not answer. */
  gender?: Gender;
  password: string;
  /** From checking the SIGNUP code sent to `mobile`. */
  otpTicket: string;
}

/** The user as the API returns it. The password hash never leaves the server. */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** International form, for example "+447400123456". */
  mobile: string;
  gender: Gender | null;
  /** What the person may do. Everyone who registers is a customer. */
  role: Role;
  /** When the person proved they hold the mobile with a code, or null. */
  phoneVerifiedAt: string | null;
  /** When the person proved they read the mailbox with a code, or null. */
  emailVerifiedAt: string | null;
  createdAt: string;
}

/** Body of POST /api/v1/auth/login. */
export interface LoginInput {
  email: string;
  password: string;
  /** Stay signed in for 30 days on this device instead of 1. */
  rememberMe: boolean;
}

/** Answer of POST /api/v1/auth/login. The refresh token is not here: it is in a cookie. */
export interface LoginResult {
  user: User;
  accessToken: string;
  tokenType: 'Bearer';
  /** Seconds until the access token expires. */
  expiresIn: number;
}

/** Answer of every "send a code" request. */
export interface CodeSent {
  /** Masked, for example "+44 •••• ••3456" or "s•••@example.com". */
  sentTo: string;
  channel: 'SMS' | 'EMAIL';
  expiresInSeconds: number;
  /** How long before another code may be asked for. */
  resendAfterSeconds: number;
}

/** Answer of checking a code: proof for the next step, valid 15 minutes, usable once. */
export interface CodeTicket {
  ticket: string;
  expiresInSeconds: number;
}

/** `details` of a 400 VALIDATION_ERROR: the messages for each field. */
export type FieldErrors<T> = Partial<Record<keyof T, string[]>>;
