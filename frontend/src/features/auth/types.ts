export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const;

export type Gender = (typeof GENDER_OPTIONS)[number]['value'];

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
  createdAt: string;
}

/** Body of POST /api/v1/auth/login. */
export interface LoginInput {
  email: string;
  password: string;
}

/** Answer of POST /api/v1/auth/login. The refresh token is not here: it is in a cookie. */
export interface LoginResult {
  user: User;
  accessToken: string;
  tokenType: 'Bearer';
  /** Seconds until the access token expires. */
  expiresIn: number;
}

/** `details` of a 400 VALIDATION_ERROR: the messages for each field. */
export type FieldErrors<T> = Partial<Record<keyof T, string[]>>;
