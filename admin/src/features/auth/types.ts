export type StaffRole = 'ADMIN' | 'DISPATCHER';

/** A signed-in staff member, as `/admin/auth/me` returns them. */
export interface StaffUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: StaffRole;
}

/** Body of POST /api/v1/admin/auth/login. */
export interface StaffLoginInput {
  email: string;
  password: string;
}

/** Answer of POST /api/v1/admin/auth/login. The refresh token is in a cookie. */
export interface StaffLoginResult {
  user: StaffUser;
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}
