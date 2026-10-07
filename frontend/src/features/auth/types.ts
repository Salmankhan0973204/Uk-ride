/** Body of POST /api/v1/auth/register. */
export interface RegisterInput {
  email: string;
  password: string;
}

/** The user as the API returns it. The password hash never leaves the server. */
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

/** `details` of a 400 VALIDATION_ERROR: the messages for each field. */
export type FieldErrors<T> = Partial<Record<keyof T, string[]>>;
