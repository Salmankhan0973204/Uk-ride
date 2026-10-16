import { APP_VERSION } from '../config/env.js';
import { GENDERS } from '../modules/auth/auth.schemas.js';

const errorCodes = [
  'BAD_REQUEST',
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'SERVICE_UNAVAILABLE',
];

/** Wraps a `data` schema in the standard success envelope. */
function successEnvelope(data: Record<string, unknown>) {
  return {
    type: 'object',
    required: ['success', 'message', 'data'],
    properties: {
      success: { type: 'boolean', enum: [true] },
      message: { type: 'string' },
      data,
      meta: { type: 'object', additionalProperties: true },
    },
  };
}

function jsonResponse(description: string, schema: Record<string, unknown>) {
  return { description, content: { 'application/json': { schema } } };
}

/**
 * OpenAPI description of the API, served by Swagger UI at /api/v1/docs.
 * Add the paths and schemas of each module here when the module is built.
 */
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'UkRide API',
    version: APP_VERSION,
    description:
      'Every endpoint answers with the success envelope or the error envelope. ' +
      'Every response carries an `x-request-id` header.',
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'Health', description: 'Service status checks' },
    { name: 'Auth', description: 'Accounts and sign-in' },
    { name: 'Users', description: 'Your own profile' },
    { name: 'Vehicle types', description: 'The classes of car on offer' },
    { name: 'Quotes', description: 'The price of a journey' },
    { name: 'Admin', description: "For the operator's staff. Needs the ADMIN role" },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'General service information',
        responses: {
          200: jsonResponse(
            'API is healthy',
            successEnvelope({ $ref: '#/components/schemas/HealthInfo' }),
          ),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/health/live': {
      get: {
        tags: ['Health'],
        summary: 'Liveness: the process is running',
        responses: {
          200: jsonResponse(
            'Process is alive',
            successEnvelope({
              type: 'object',
              required: ['status'],
              properties: { status: { type: 'string', enum: ['live'] } },
            }),
          ),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness: dependencies are reachable',
        responses: {
          200: jsonResponse(
            'Service is ready',
            successEnvelope({ $ref: '#/components/schemas/Readiness' }),
          ),
          500: { $ref: '#/components/responses/Error' },
          503: jsonResponse('A dependency is down. `error.details.checks` shows which one.', {
            $ref: '#/components/schemas/ApiFailure',
          }),
        },
      },
    },
    '/auth/check-email': {
      post: {
        tags: ['Auth'],
        summary: 'Is this email free?',
        description: 'The first step of sign-up, as on ukride.uk.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EmailOnly' } } },
        },
        responses: {
          200: jsonResponse(
            'Answer',
            successEnvelope({ type: 'object', properties: { available: { type: 'boolean' } } }),
          ),
          400: jsonResponse('Not an email address', { $ref: '#/components/schemas/ApiFailure' }),
          429: { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account',
        description:
          'As on ukride.uk, the mobile is proved first: send a SIGNUP code with ' +
          '`/auth/otp/send`, check it with `/auth/otp/verify`, and send the ticket as ' +
          '`otpTicket`. The email is trimmed and lower-cased; the mobile is stored in ' +
          'international form. The answer signs the person in, like `/auth/login`.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } },
          },
        },
        responses: {
          201: jsonResponse(
            'Account created',
            successEnvelope({
              type: 'object',
              required: ['user'],
              properties: { user: { $ref: '#/components/schemas/User' } },
            }),
          ),
          400: jsonResponse(
            'Validation failed. `error.details` lists the messages for each field.',
            { $ref: '#/components/schemas/ApiFailure' },
          ),
          409: jsonResponse(
            'The email or the mobile number already has an account. ' +
              '`error.details.field` is `email` or `mobile`.',
            { $ref: '#/components/schemas/ApiFailure' },
          ),
          429: { $ref: '#/components/responses/RateLimited' },
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/auth/otp/send': {
      post: {
        tags: ['Auth'],
        summary: 'Send a 6-digit code to a mobile',
        description:
          'For SIGNUP (refused with 409 if the mobile already has an account) or GUEST_BOOKING. ' +
          'The code lasts 10 minutes; another can be sent after 60 seconds, at most 5 an hour ' +
          'to one number. In development the SMS is delivered to Mailpit.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['purpose', 'mobile'],
                properties: {
                  purpose: { type: 'string', enum: ['SIGNUP', 'GUEST_BOOKING'] },
                  mobile: { type: 'string', example: '+44 7400 123456' },
                },
              },
            },
          },
        },
        responses: {
          200: jsonResponse('Code sent', successEnvelope({ type: 'object' })),
          400: jsonResponse('The mobile or purpose is not valid', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          409: jsonResponse('Sign-up: the mobile already has an account', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          429: jsonResponse('Too soon after the last code, or too many codes this hour', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          503: jsonResponse('The code could not be sent', {
            $ref: '#/components/schemas/ApiFailure',
          }),
        },
      },
    },
    '/auth/otp/verify': {
      post: {
        tags: ['Auth'],
        summary: 'Check a code and get a ticket',
        description:
          'Five wrong tries end the code. The right code is used up and answered with a ticket ' +
          'valid for 15 minutes and usable once, which the next step (sign-up, guest booking) ' +
          'asks for.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['purpose', 'mobile', 'code'],
                properties: {
                  purpose: { type: 'string', enum: ['SIGNUP', 'GUEST_BOOKING'] },
                  mobile: { type: 'string' },
                  code: { type: 'string', example: '519012' },
                },
              },
            },
          },
        },
        responses: {
          200: jsonResponse(
            'Code accepted',
            successEnvelope({
              type: 'object',
              properties: { ticket: { type: 'string' }, expiresInSeconds: { type: 'integer' } },
            }),
          ),
          400: jsonResponse('Wrong, expired or used code; the message says which', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          429: { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in',
        description:
          'Checks the email and password and returns the user with a short-lived access ' +
          'token. Send the token on later requests as `Authorization: Bearer <token>`. ' +
          'A wrong password and an unknown email get the same 401, on purpose. ' +
          'Also sets the httpOnly cookie `ukride_refresh`, used by `/auth/refresh` and ' +
          '`/auth/logout`. With `rememberMe: true` the session lasts 30 days ' +
          '(`REMEMBER_ME_DAYS`), otherwise 1 day (`CUSTOMER_SESSION_HOURS`); every refresh ' +
          'keeps that lifetime. At most 5 sign-in attempts a minute from one address.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
          },
        },
        responses: {
          200: jsonResponse(
            'Signed in',
            successEnvelope({ $ref: '#/components/schemas/LoginResult' }),
          ),
          400: jsonResponse(
            'Validation failed. `error.details` lists the messages for each field.',
            { $ref: '#/components/schemas/ApiFailure' },
          ),
          401: jsonResponse('Email or password is incorrect', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          429: { $ref: '#/components/responses/RateLimited' },
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Get a new access token',
        description:
          'Uses the `ukride_refresh` cookie set by `/auth/login`; there is no body. ' +
          'Answers with a new access token and replaces the cookie with a new refresh ' +
          'token. Each refresh token works once. If a used token is sent again, every ' +
          'session of that user is ended.',
        security: [{ refreshCookie: [] }],
        responses: {
          200: jsonResponse(
            'Session refreshed',
            successEnvelope({ $ref: '#/components/schemas/AccessToken' }),
          ),
          401: jsonResponse('No cookie, or a token that is unknown, used, expired or revoked', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          429: { $ref: '#/components/responses/RateLimited' },
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Sign out',
        description:
          'Revokes the refresh token in the `ukride_refresh` cookie and removes the cookie. ' +
          'Always answers 200, so signing out twice is not an error. Access tokens ' +
          'issued in that session stop working at once.',
        security: [{ refreshCookie: [] }],
        responses: {
          200: jsonResponse('Signed out', successEnvelope({ type: 'object', nullable: true })),
          429: { $ref: '#/components/responses/RateLimited' },
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'The signed-in user',
        description:
          'A protected route. Send the access token from `/auth/login` in the header ' +
          '`Authorization: Bearer <token>`. In Swagger UI, press Authorize and paste the token.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: jsonResponse(
            'Signed-in user',
            successEnvelope({
              type: 'object',
              required: ['user'],
              properties: { user: { $ref: '#/components/schemas/User' } },
            }),
          ),
          401: jsonResponse('No token, or a token that is invalid or expired', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Forgot password: send a code to the email',
        description:
          'Step 1 of 3, as on ukride.uk. If the email has an account, a 6-digit ' +
          'RESET_PASSWORD code is sent to it: valid 10 minutes, a new one after 60 s, at most 5 ' +
          'an hour. The answer is always the same 200, sent before the email goes out, so it ' +
          'cannot be used to find out who is registered. Limited to 5 an hour per address.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EmailOnly' } } },
        },
        responses: {
          200: jsonResponse(
            'The same answer for every address',
            successEnvelope({
              type: 'object',
              properties: {
                sentTo: { type: 'string', example: 's•••@example.com' },
                channel: { type: 'string', enum: ['EMAIL'] },
                expiresInSeconds: { type: 'integer', example: 600 },
                resendAfterSeconds: { type: 'integer', example: 60 },
              },
            }),
          ),
          400: jsonResponse('The email address is missing or badly formed', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          429: { $ref: '#/components/responses/RateLimited' },
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/auth/forgot-password/verify': {
      post: {
        tags: ['Auth'],
        summary: 'Forgot password: check the code',
        description:
          'Step 2 of 3. Five wrong tries end the code. The right code is answered with a ' +
          'ticket for this email, valid 15 minutes and usable once.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'code'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  code: { type: 'string', example: '519012' },
                },
              },
            },
          },
        },
        responses: {
          200: jsonResponse(
            'Code accepted',
            successEnvelope({
              type: 'object',
              properties: { ticket: { type: 'string' }, expiresInSeconds: { type: 'integer' } },
            }),
          ),
          400: jsonResponse('Wrong, expired or used code; the message says which', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          429: { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Forgot password: choose a new password',
        description:
          'Step 3 of 3. Takes the email, the ticket from step 2 and the new password. Every ' +
          'session of the account ends, on every device, and this browser is signed in ' +
          'afresh: the answer is the same as from `/auth/login`, with the `ukride_refresh` cookie.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } },
          },
        },
        responses: {
          200: jsonResponse(
            'Password changed and signed in',
            successEnvelope({ $ref: '#/components/schemas/LoginResult' }),
          ),
          400: jsonResponse('The ticket is not usable, or the password breaks the rules', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          429: { $ref: '#/components/responses/RateLimited' },
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Your profile',
        description:
          'The profile of the signed-in user. There is no user id in the address: "me" is ' +
          'whoever the access token names.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: jsonResponse(
            'Your profile',
            successEnvelope({
              type: 'object',
              required: ['user'],
              properties: { user: { $ref: '#/components/schemas/Profile' } },
            }),
          ),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Change your profile',
        description:
          'A partial update: send only the fields to change. `gender: null` clears it. ' +
          'The email cannot be changed here, and any field not listed is refused.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileRequest' } },
          },
        },
        responses: {
          200: jsonResponse(
            'Profile updated',
            successEnvelope({
              type: 'object',
              required: ['user'],
              properties: { user: { $ref: '#/components/schemas/Profile' } },
            }),
          ),
          400: jsonResponse(
            'A field breaks its rule, an unknown field was sent, or the body is empty',
            { $ref: '#/components/schemas/ApiFailure' },
          ),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          409: jsonResponse('The mobile number belongs to another account', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/users/me/password': {
      post: {
        tags: ['Users'],
        summary: 'Change your password',
        description:
          'Asks for the current password again, even though you are signed in. On success ' +
          'every other device is signed out and this one stays signed in. A wrong current ' +
          'password answers 400 under `details.currentPassword`, not 401.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } },
          },
        },
        responses: {
          200: jsonResponse(
            'Password changed',
            successEnvelope({ type: 'object', nullable: true }),
          ),
          400: jsonResponse(
            'The current password is wrong, or the new one breaks the rules or equals the old one',
            { $ref: '#/components/schemas/ApiFailure' },
          ),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          429: { $ref: '#/components/responses/RateLimited' },
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/vehicle-types': {
      get: {
        tags: ['Vehicle types'],
        summary: 'The catalogue',
        description:
          'Every vehicle type on offer, in list order. Public: no sign-in needed. ' +
          'A type that was switched off is left out.',
        responses: {
          200: jsonResponse(
            'Vehicle types',
            successEnvelope({
              type: 'object',
              required: ['vehicleTypes'],
              properties: {
                vehicleTypes: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/VehicleType' },
                },
              },
            }),
          ),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/vehicle-types/{slug}': {
      get: {
        tags: ['Vehicle types'],
        summary: 'One vehicle type',
        description:
          'Public. A type that was switched off answers 404, like one that never existed.',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'executive' },
          },
        ],
        responses: {
          200: jsonResponse(
            'Vehicle type',
            successEnvelope({
              type: 'object',
              required: ['vehicleType'],
              properties: { vehicleType: { $ref: '#/components/schemas/VehicleType' } },
            }),
          ),
          404: jsonResponse('No vehicle type on offer has this slug', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/admin/auth/login': {
      post: {
        tags: ['Admin'],
        summary: 'Staff sign-in for the admin panel',
        description:
          'The same email and password as on the customer site, for an ADMIN or DISPATCHER ' +
          'account. Returns a staff access token (audience ukride-staff) and sets the ' +
          'httpOnly cookie `ukride_staff_refresh` on the path /api/v1/admin/auth. Staff ' +
          'sessions last 12 hours and are separate from customer sessions.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
          },
        },
        responses: {
          200: jsonResponse(
            'Signed in',
            successEnvelope({ $ref: '#/components/schemas/LoginResult' }),
          ),
          401: jsonResponse('Email or password is incorrect', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          403: jsonResponse('The account is not staff', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          429: { $ref: '#/components/responses/RateLimited' },
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/admin/auth/refresh': {
      post: {
        tags: ['Admin'],
        summary: 'New staff access token',
        description:
          'Uses the `ukride_staff_refresh` cookie. A token exchanged less than 30 seconds ' +
          'ago answers 409 with `details.retry` (try again: the browser already holds the ' +
          'new cookie); one exchanged earlier is treated as stolen and ends every session.',
        security: [{ staffRefreshCookie: [] }],
        responses: {
          200: jsonResponse(
            'Session refreshed',
            successEnvelope({ $ref: '#/components/schemas/AccessToken' }),
          ),
          401: jsonResponse('The session has ended', { $ref: '#/components/schemas/ApiFailure' }),
          409: jsonResponse('Refreshed a moment ago: try again', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          429: { $ref: '#/components/responses/RateLimited' },
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/admin/auth/logout': {
      post: {
        tags: ['Admin'],
        summary: 'Staff sign-out',
        description: 'Ends the staff session only; a customer sign-in in the same browser stays.',
        security: [{ staffRefreshCookie: [] }],
        responses: {
          200: jsonResponse('Signed out', successEnvelope({ nullable: true })),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/admin/auth/me': {
      get: {
        tags: ['Admin'],
        summary: 'The signed-in staff member',
        description: 'Needs a staff access token. The role is checked again on every call.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: jsonResponse(
            'Signed-in staff member',
            successEnvelope({
              type: 'object',
              required: ['user'],
              properties: { user: { $ref: '#/components/schemas/User' } },
            }),
          ),
          401: jsonResponse('Not signed in as staff', { $ref: '#/components/schemas/ApiFailure' }),
          403: jsonResponse('Signed in, but no longer staff', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/admin/vehicle-types': {
      get: {
        tags: ['Admin'],
        summary: 'Every vehicle type',
        description:
          'The whole catalogue, including types that are switched off, with the fields ' +
          'needed to manage it.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: jsonResponse(
            'All vehicle types',
            successEnvelope({
              type: 'object',
              required: ['vehicleTypes'],
              properties: {
                vehicleTypes: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/AdminVehicleType' },
                },
              },
            }),
          ),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          403: jsonResponse('Signed in, but not an admin', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Add a vehicle type',
        description:
          'Without a slug, one is made from the name ("People carrier" becomes ' +
          '"people-carrier"). Without a sort order, the type goes to the end of the list.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateVehicleTypeRequest' },
            },
          },
        },
        responses: {
          201: jsonResponse(
            'Vehicle type created',
            successEnvelope({
              type: 'object',
              required: ['vehicleType'],
              properties: { vehicleType: { $ref: '#/components/schemas/AdminVehicleType' } },
            }),
          ),
          400: jsonResponse('A field breaks its rule, or an unknown field was sent', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          403: jsonResponse('Signed in, but not an admin', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          409: jsonResponse('Another vehicle type already uses this slug', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/admin/vehicle-types/{id}': {
      patch: {
        tags: ['Admin'],
        summary: 'Change a vehicle type',
        description:
          'A partial update: send only the fields to change. The slug cannot be changed. ' +
          '`isActive: true` switches a type back on.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateVehicleTypeRequest' },
            },
          },
        },
        responses: {
          200: jsonResponse(
            'Vehicle type updated',
            successEnvelope({
              type: 'object',
              required: ['vehicleType'],
              properties: { vehicleType: { $ref: '#/components/schemas/AdminVehicleType' } },
            }),
          ),
          400: jsonResponse(
            'A field breaks its rule, an unknown field was sent, or the body is empty',
            {
              $ref: '#/components/schemas/ApiFailure',
            },
          ),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          403: jsonResponse('Signed in, but not an admin', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          404: jsonResponse('No vehicle type has this id', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Switch a vehicle type off',
        description:
          'A soft delete: the type leaves the public catalogue and the row is kept. ' +
          'Calling it again changes nothing.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: jsonResponse(
            'Vehicle type switched off',
            successEnvelope({
              type: 'object',
              required: ['vehicleType'],
              properties: { vehicleType: { $ref: '#/components/schemas/AdminVehicleType' } },
            }),
          ),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          403: jsonResponse('Signed in, but not an admin', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          404: jsonResponse('No vehicle type has this id', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/admin/vehicles': {
      get: {
        tags: ['Admin'],
        summary: 'The fleet, one page at a time',
        description:
          'Sorted by registration. Filters combine. `search` looks in the registration ' +
          '(spaces and case ignored), make, model and colour. A page past the last one ' +
          'answers 200 with no rows.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['ACTIVE', 'MAINTENANCE', 'RETIRED'] },
          },
          {
            name: 'type',
            in: 'query',
            description: "A vehicle type's slug",
            schema: { type: 'string', example: 'executive' },
          },
          { name: 'search', in: 'query', schema: { type: 'string', maxLength: 40 } },
        ],
        responses: {
          200: jsonResponse('Vehicles', {
            allOf: [
              successEnvelope({
                type: 'object',
                required: ['vehicles'],
                properties: {
                  vehicles: { type: 'array', items: { $ref: '#/components/schemas/Vehicle' } },
                },
              }),
              {
                type: 'object',
                required: ['meta'],
                properties: { meta: { $ref: '#/components/schemas/PageMeta' } },
              },
            ],
          }),
          400: jsonResponse('A query value is not valid, or an unknown name was used', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          403: jsonResponse('Signed in, but not an admin', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Add a vehicle to the fleet',
        description:
          'The registration is stored in capitals without spaces ("ab12 cde" becomes ' +
          '"AB12CDE"). The vehicle type must be on offer. A new vehicle is always ACTIVE.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateVehicleRequest' } },
          },
        },
        responses: {
          201: jsonResponse(
            'Vehicle added',
            successEnvelope({
              type: 'object',
              required: ['vehicle'],
              properties: { vehicle: { $ref: '#/components/schemas/Vehicle' } },
            }),
          ),
          400: jsonResponse(
            'A field breaks its rule, the type is not on offer, or an unknown field was sent',
            { $ref: '#/components/schemas/ApiFailure' },
          ),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          403: jsonResponse('Signed in, but not an admin', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          409: jsonResponse('Another vehicle already has this registration', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/admin/vehicles/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'One vehicle',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: jsonResponse(
            'Vehicle',
            successEnvelope({
              type: 'object',
              required: ['vehicle'],
              properties: { vehicle: { $ref: '#/components/schemas/Vehicle' } },
            }),
          ),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          403: jsonResponse('Signed in, but not an admin', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          404: jsonResponse('No vehicle has this id', { $ref: '#/components/schemas/ApiFailure' }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
      patch: {
        tags: ['Admin'],
        summary: 'Change a vehicle',
        description:
          'A partial update. Status cannot be changed here. Moving the vehicle to another ' +
          'type needs that type to be on offer.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateVehicleRequest' } },
          },
        },
        responses: {
          200: jsonResponse(
            'Vehicle updated',
            successEnvelope({
              type: 'object',
              required: ['vehicle'],
              properties: { vehicle: { $ref: '#/components/schemas/Vehicle' } },
            }),
          ),
          400: jsonResponse(
            'A field breaks its rule, an unknown field was sent, or the body is empty',
            { $ref: '#/components/schemas/ApiFailure' },
          ),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          403: jsonResponse('Signed in, but not an admin', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          404: jsonResponse('No vehicle has this id', { $ref: '#/components/schemas/ApiFailure' }),
          409: jsonResponse('Another vehicle already has this registration', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/admin/vehicles/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: "Change a vehicle's status",
        description:
          'ACTIVE (can be given jobs), MAINTENANCE (in the garage) or RETIRED (left the ' +
          'fleet, kept for history). Every move is allowed, including back from RETIRED. ' +
          'Asking for the status the vehicle already has changes nothing.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                additionalProperties: false,
                properties: {
                  status: { type: 'string', enum: ['ACTIVE', 'MAINTENANCE', 'RETIRED'] },
                },
              },
            },
          },
        },
        responses: {
          200: jsonResponse(
            'Vehicle status changed',
            successEnvelope({
              type: 'object',
              required: ['vehicle'],
              properties: { vehicle: { $ref: '#/components/schemas/Vehicle' } },
            }),
          ),
          400: jsonResponse('Not one of the three statuses, or another field was sent', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          403: jsonResponse('Signed in, but not an admin', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          404: jsonResponse('No vehicle has this id', { $ref: '#/components/schemas/ApiFailure' }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/admin/pricing': {
      get: {
        tags: ['Admin'],
        summary: 'Prices of every vehicle type',
        description:
          'Every vehicle type in list order, switched off or not, with its pricing rule, or ' +
          'null where no prices are set yet. Amounts are whole pence.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: jsonResponse(
            'Pricing',
            successEnvelope({
              type: 'object',
              required: ['vehicleTypes'],
              properties: {
                vehicleTypes: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/VehicleTypePricing' },
                },
              },
            }),
          ),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          403: jsonResponse('Signed in, but not an admin', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/admin/pricing/{vehicleTypeId}': {
      put: {
        tags: ['Admin'],
        summary: 'Set the prices of one vehicle type',
        description:
          'Creates the rule the first time and replaces it after that. Every field is ' +
          'required. Amounts are whole pence: 350 is £3.50.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'vehicleTypeId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PricingRuleRequest' } },
          },
        },
        responses: {
          200: jsonResponse(
            'Prices saved',
            successEnvelope({
              type: 'object',
              required: ['vehicleType'],
              properties: { vehicleType: { $ref: '#/components/schemas/VehicleTypePricing' } },
            }),
          ),
          400: jsonResponse('An amount is missing, not whole pence, negative or too large', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          403: jsonResponse('Signed in, but not an admin', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          404: jsonResponse('No vehicle type has this id', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/quotes': {
      post: {
        tags: ['Quotes'],
        summary: 'Price a journey',
        description:
          'Public. Prices the journey in every vehicle type that is on offer and has prices, ' +
          'or only in `vehicleType`. Give two UK postcodes and the road distance is measured ' +
          '(postcodes.io and OSRM), or give `distanceMiles` instead. The distance is charged ' +
          'to the nearest tenth of a mile. ' +
          'Amounts are whole pence, and each total is the sum of its lines. Nothing is saved.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  pickupPostcode: { type: 'string', example: 'SW1A 1AA' },
                  dropoffPostcode: { type: 'string', example: 'TW6 1EW' },
                  distanceMiles: {
                    type: 'number',
                    minimum: 0.1,
                    maximum: 1000,
                    description: 'Instead of the two postcodes, not with them',
                  },
                  pickupAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2026-11-02T23:30:00Z',
                    description: 'With a time zone. Left out: now. Not in the past.',
                  },
                  airport: { type: 'boolean', default: false },
                  vehicleType: { type: 'string', example: 'executive' },
                },
              },
            },
          },
        },
        responses: {
          200: jsonResponse(
            'Quotes, or none when no prices are published yet',
            successEnvelope({ $ref: '#/components/schemas/QuoteResult' }),
          ),
          400: jsonResponse('The distance is missing, not a number, or out of range', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          404: jsonResponse('The vehicle type asked for is not on offer or has no prices', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          429: { $ref: '#/components/responses/RateLimited' },
          503: jsonResponse('The postcode or routing service could not be reached', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      refreshCookie: { type: 'apiKey', in: 'cookie', name: 'ukride_refresh' },
      staffRefreshCookie: { type: 'apiKey', in: 'cookie', name: 'ukride_staff_refresh' },
    },
    schemas: {
      EmailOnly: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email', example: 'sara@example.com' } },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['email', 'otpTicket', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          otpTicket: { type: 'string', description: 'From /auth/forgot-password/verify' },
          password: { type: 'string', minLength: 8, maxLength: 72, example: 'a-brand-new-pass' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'sara@example.com' },
          password: { type: 'string', example: 'secret-pass-1' },
          rememberMe: {
            type: 'boolean',
            default: false,
            description:
              'Customer sign-in only: a 30-day session instead of a 1-day one. Staff ignore it.',
          },
        },
      },
      AccessToken: {
        type: 'object',
        required: ['accessToken', 'tokenType', 'expiresIn'],
        properties: {
          accessToken: { type: 'string', description: 'A signed JWT.' },
          tokenType: { type: 'string', enum: ['Bearer'] },
          expiresIn: { type: 'integer', example: 900 },
        },
      },
      LoginResult: {
        type: 'object',
        required: ['user', 'accessToken', 'tokenType', 'expiresIn'],
        properties: {
          user: { $ref: '#/components/schemas/User' },
          accessToken: { type: 'string', description: 'A signed JWT.' },
          tokenType: { type: 'string', enum: ['Bearer'] },
          expiresIn: {
            type: 'integer',
            description: 'Seconds until the access token expires.',
            example: 900,
          },
        },
      },
      Gender: { type: 'string', enum: GENDERS },
      RegisterRequest: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'mobile', 'password', 'otpTicket'],
        properties: {
          otpTicket: { type: 'string', description: 'From /auth/otp/verify with purpose SIGNUP' },
          firstName: { type: 'string', minLength: 1, maxLength: 50, example: 'Sara' },
          lastName: { type: 'string', minLength: 1, maxLength: 50, example: 'Khan' },
          email: { type: 'string', format: 'email', example: 'sara@example.com' },
          mobile: {
            type: 'string',
            description: 'With the country code. Spaces, dashes and brackets are allowed.',
            example: '+44 7400 123456',
          },
          gender: { $ref: '#/components/schemas/Gender' },
          password: { type: 'string', minLength: 8, maxLength: 72, example: 'secret-pass-1' },
        },
      },
      User: {
        type: 'object',
        required: [
          'id',
          'firstName',
          'lastName',
          'email',
          'mobile',
          'gender',
          'role',
          'emailVerifiedAt',
          'createdAt',
        ],
        properties: {
          id: { type: 'string', format: 'uuid' },
          firstName: { type: 'string', example: 'Sara' },
          lastName: { type: 'string', example: 'Khan' },
          email: { type: 'string', format: 'email', example: 'sara@example.com' },
          mobile: { type: 'string', example: '+447400123456' },
          gender: {
            allOf: [{ $ref: '#/components/schemas/Gender' }],
            nullable: true,
            description: 'null when the customer left it out',
          },
          role: {
            type: 'string',
            enum: ['CUSTOMER', 'DRIVER', 'DISPATCHER', 'ADMIN'],
            description: 'CUSTOMER for everyone who registers',
          },
          emailVerifiedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'null until the person opens the confirmation link',
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', example: 'secret-pass-1' },
          newPassword: { type: 'string', minLength: 8, maxLength: 72, example: 'a-brand-new-pass' },
        },
      },
      UpdateProfileRequest: {
        type: 'object',
        additionalProperties: false,
        minProperties: 1,
        properties: {
          firstName: { type: 'string', minLength: 1, maxLength: 50, example: 'Sara' },
          lastName: { type: 'string', minLength: 1, maxLength: 50, example: 'Khan' },
          mobile: { type: 'string', example: '+44 7400 123456' },
          gender: {
            allOf: [{ $ref: '#/components/schemas/Gender' }],
            nullable: true,
            description: 'null clears it',
          },
        },
      },
      Profile: {
        allOf: [
          { $ref: '#/components/schemas/User' },
          {
            type: 'object',
            required: ['updatedAt'],
            properties: {
              updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'When the profile was last changed',
              },
            },
          },
        ],
      },
      HealthInfo: {
        type: 'object',
        required: ['status', 'service', 'version', 'env', 'uptimeSeconds', 'timestamp'],
        properties: {
          status: { type: 'string', enum: ['ok'] },
          service: { type: 'string', example: 'ukride-api' },
          version: { type: 'string', example: APP_VERSION },
          env: { type: 'string', enum: ['development', 'test', 'production'] },
          uptimeSeconds: { type: 'integer', example: 42 },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      Readiness: {
        type: 'object',
        required: ['status', 'checks'],
        properties: {
          status: { type: 'string', enum: ['ready'] },
          checks: {
            type: 'object',
            additionalProperties: { $ref: '#/components/schemas/DependencyCheck' },
          },
        },
      },
      DependencyCheck: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['up', 'down', 'skipped'] },
          note: { type: 'string' },
        },
      },
      VehicleType: {
        type: 'object',
        required: ['id', 'slug', 'name', 'description', 'passengers', 'suitcases'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string', example: 'executive' },
          name: { type: 'string', example: 'Executive' },
          description: { type: 'string' },
          passengers: { type: 'integer', example: 4 },
          suitcases: { type: 'integer', example: 2 },
        },
      },
      AdminVehicleType: {
        allOf: [
          { $ref: '#/components/schemas/VehicleType' },
          {
            type: 'object',
            required: ['sortOrder', 'isActive', 'createdAt', 'updatedAt'],
            properties: {
              sortOrder: { type: 'integer', example: 30, description: 'Lower is listed first' },
              isActive: { type: 'boolean', description: 'false when switched off' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      CreateVehicleTypeRequest: {
        type: 'object',
        required: ['name', 'description', 'passengers', 'suitcases'],
        additionalProperties: false,
        properties: {
          name: { type: 'string', maxLength: 40, example: 'Luxury MPV' },
          slug: {
            type: 'string',
            maxLength: 40,
            example: 'luxury-mpv',
            description: 'Letters, numbers and hyphens. Made from the name when left out.',
          },
          description: { type: 'string', maxLength: 200, example: 'Seven seats with legroom.' },
          passengers: { type: 'integer', minimum: 1, maximum: 8, example: 7 },
          suitcases: { type: 'integer', minimum: 0, maximum: 20, example: 5 },
          sortOrder: { type: 'integer', minimum: 0, maximum: 9999 },
        },
      },
      UpdateVehicleTypeRequest: {
        type: 'object',
        additionalProperties: false,
        minProperties: 1,
        properties: {
          name: { type: 'string', maxLength: 40 },
          description: { type: 'string', maxLength: 200 },
          passengers: { type: 'integer', minimum: 1, maximum: 8 },
          suitcases: { type: 'integer', minimum: 0, maximum: 20 },
          sortOrder: { type: 'integer', minimum: 0, maximum: 9999 },
          isActive: { type: 'boolean' },
        },
        example: { suitcases: 6 },
      },
      Vehicle: {
        type: 'object',
        required: [
          'id',
          'registration',
          'make',
          'model',
          'colour',
          'year',
          'status',
          'vehicleType',
        ],
        properties: {
          id: { type: 'string', format: 'uuid' },
          registration: { type: 'string', example: 'AB12CDE' },
          make: { type: 'string', example: 'Mercedes-Benz' },
          model: { type: 'string', example: 'E-Class' },
          colour: { type: 'string', example: 'Black' },
          year: { type: 'integer', example: 2023 },
          status: { type: 'string', enum: ['ACTIVE', 'MAINTENANCE', 'RETIRED'] },
          vehicleType: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              slug: { type: 'string', example: 'executive' },
              name: { type: 'string', example: 'Executive' },
              isActive: { type: 'boolean' },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateVehicleRequest: {
        type: 'object',
        required: ['registration', 'make', 'model', 'colour', 'year', 'vehicleTypeId'],
        additionalProperties: false,
        properties: {
          registration: {
            type: 'string',
            example: 'AB12 CDE',
            description: '2 to 8 letters and numbers; spaces are removed',
          },
          make: { type: 'string', maxLength: 40, example: 'Mercedes-Benz' },
          model: { type: 'string', maxLength: 40, example: 'E-Class' },
          colour: { type: 'string', maxLength: 30, example: 'Black' },
          year: { type: 'integer', minimum: 1990, example: 2023 },
          vehicleTypeId: { type: 'string', format: 'uuid' },
        },
      },
      UpdateVehicleRequest: {
        type: 'object',
        additionalProperties: false,
        minProperties: 1,
        properties: {
          registration: {
            type: 'string',
            example: 'AB12 CDE',
            description: '2 to 8 letters and numbers; spaces are removed',
          },
          make: { type: 'string', maxLength: 40, example: 'Mercedes-Benz' },
          model: { type: 'string', maxLength: 40, example: 'E-Class' },
          colour: { type: 'string', maxLength: 30, example: 'Black' },
          year: { type: 'integer', minimum: 1990, example: 2023 },
          vehicleTypeId: { type: 'string', format: 'uuid' },
        },
        example: { colour: 'Silver' },
      },
      PageMeta: {
        type: 'object',
        required: ['page', 'pageSize', 'total', 'totalPages'],
        properties: {
          page: { type: 'integer', example: 2 },
          pageSize: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 25, description: 'Rows matching the filters' },
          totalPages: { type: 'integer', example: 2 },
        },
      },
      PricingRuleRequest: {
        type: 'object',
        required: [
          'baseFarePence',
          'perMilePence',
          'minimumFarePence',
          'nightSurchargePercent',
          'airportFeePence',
        ],
        additionalProperties: false,
        properties: {
          baseFarePence: { type: 'integer', minimum: 0, maximum: 100000, example: 350 },
          perMilePence: { type: 'integer', minimum: 0, maximum: 10000, example: 210 },
          minimumFarePence: { type: 'integer', minimum: 0, maximum: 100000, example: 1200 },
          nightSurchargePercent: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
            example: 25,
            description: 'Added for a pick-up from 22:00 to 06:00 UK time',
          },
          airportFeePence: { type: 'integer', minimum: 0, maximum: 10000, example: 500 },
        },
      },
      VehicleTypePricing: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string', example: 'executive' },
          name: { type: 'string', example: 'Executive' },
          isActive: { type: 'boolean' },
          pricingRule: {
            nullable: true,
            allOf: [
              { $ref: '#/components/schemas/PricingRuleRequest' },
              {
                type: 'object',
                properties: { updatedAt: { type: 'string', format: 'date-time' } },
              },
            ],
          },
        },
      },
      QuoteLine: {
        type: 'object',
        required: ['code', 'label', 'amountPence'],
        properties: {
          code: {
            type: 'string',
            enum: [
              'BASE_FARE',
              'DISTANCE',
              'MINIMUM_FARE_TOP_UP',
              'NIGHT_SURCHARGE',
              'AIRPORT_FEE',
            ],
          },
          label: { type: 'string', example: '12.4 miles at £2.10 a mile' },
          amountPence: { type: 'integer', example: 2604 },
        },
      },
      QuoteResult: {
        type: 'object',
        required: ['distanceMiles', 'chargedMiles', 'currency', 'quotes'],
        properties: {
          distanceMiles: { type: 'number', example: 12.44 },
          chargedMiles: { type: 'number', example: 12.4 },
          pickupAt: { type: 'string', format: 'date-time' },
          route: {
            nullable: true,
            description: 'The measured route, or null when distanceMiles was typed in',
            type: 'object',
            properties: {
              pickup: {
                type: 'object',
                properties: {
                  postcode: { type: 'string', example: 'SW1A 1AA' },
                  district: { type: 'string', example: 'Westminster' },
                },
              },
              dropoff: {
                type: 'object',
                properties: {
                  postcode: { type: 'string', example: 'TW6 1EW' },
                  district: { type: 'string', example: 'Hillingdon' },
                },
              },
              distanceMiles: { type: 'number', example: 16.21 },
              durationMinutes: { type: 'integer', example: 34 },
            },
          },
          night: { type: 'boolean', description: 'Pick-up between 22:00 and 06:00 UK time' },
          airport: { type: 'boolean' },
          currency: { type: 'string', enum: ['GBP'] },
          quotes: {
            type: 'array',
            items: {
              type: 'object',
              required: ['vehicleType', 'lines', 'totalPence'],
              properties: {
                vehicleType: { $ref: '#/components/schemas/VehicleType' },
                lines: { type: 'array', items: { $ref: '#/components/schemas/QuoteLine' } },
                totalPence: { type: 'integer', example: 2954 },
              },
            },
          },
        },
      },
      ApiFailure: {
        type: 'object',
        required: ['success', 'error', 'requestId'],
        properties: {
          success: { type: 'boolean', enum: [false] },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', enum: errorCodes },
              message: { type: 'string' },
              details: {},
            },
          },
          requestId: { type: 'string' },
        },
      },
    },
    responses: {
      Error: jsonResponse('Error envelope', { $ref: '#/components/schemas/ApiFailure' }),
      RateLimited: {
        description:
          'Too many requests from this address. The `Retry-After` header gives the wait in seconds.',
        headers: { 'Retry-After': { schema: { type: 'integer' } } },
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiFailure' } } },
      },
    },
  },
};
