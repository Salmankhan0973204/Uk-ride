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
    { name: 'Places', description: 'Address search for the journey form' },
    { name: 'Quotes', description: 'The price of a journey' },
    { name: 'Bookings', description: 'Booking a saved quote' },
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
          'The email and the mobile cannot be changed here (the mobile has its own ' +
          'endpoints, with a code), and any field not listed is refused.',
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
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/users/me/mobile/code': {
      post: {
        tags: ['Users'],
        summary: 'Change your mobile: send a code to the new number',
        description:
          'Step 1 of 2, as on ukride.uk. A CHANGE_MOBILE code goes by text to the new number: ' +
          'valid 10 minutes, a new one after 60 s, at most 5 an hour. Nothing changes yet.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mobile'],
                additionalProperties: false,
                properties: { mobile: { type: 'string', example: '+44 7400 123456' } },
              },
            },
          },
        },
        responses: {
          200: jsonResponse(
            'Code sent',
            successEnvelope({
              type: 'object',
              properties: {
                sentTo: { type: 'string', example: '+44 •••• ••3456' },
                channel: { type: 'string', enum: ['SMS'] },
                expiresInSeconds: { type: 'integer', example: 600 },
                resendAfterSeconds: { type: 'integer', example: 60 },
              },
            }),
          ),
          400: jsonResponse('Not a mobile number, or it is already yours', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          409: jsonResponse('The mobile number belongs to another account', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          429: { $ref: '#/components/responses/RateLimited' },
        },
      },
    },
    '/users/me/mobile': {
      post: {
        tags: ['Users'],
        summary: 'Change your mobile: check the code',
        description:
          'Step 2 of 2. The right code for this number replaces the mobile and marks it as ' +
          'verified (`phoneVerifiedAt`). Five wrong tries end the code.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mobile', 'code'],
                additionalProperties: false,
                properties: {
                  mobile: { type: 'string', example: '+44 7400 123456' },
                  code: { type: 'string', example: '519012' },
                },
              },
            },
          },
        },
        responses: {
          200: jsonResponse(
            'Mobile number changed',
            successEnvelope({
              type: 'object',
              required: ['user'],
              properties: { user: { $ref: '#/components/schemas/Profile' } },
            }),
          ),
          400: jsonResponse('Wrong, expired or used code, or the number is already yours', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          409: jsonResponse('The mobile number belongs to another account', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          429: { $ref: '#/components/responses/RateLimited' },
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
    '/config': {
      get: {
        tags: ['Quotes'],
        summary: 'Booking rules the customer site needs',
        description:
          'Public. The Meet & Greet price, how far ahead to book, the edit cut-off, how long an ' +
          'unpaid booking and a quote last, when driver details are shown, and the size limits ' +
          'of a journey. The server checks every rule again; this is for showing them.',
        responses: {
          200: jsonResponse(
            'Configuration',
            successEnvelope({ $ref: '#/components/schemas/Config' }),
          ),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/admin/settings': {
      get: {
        tags: ['Admin'],
        summary: 'The booking rules',
        description: 'Created with the defaults the first time it is read.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: jsonResponse(
            'Settings',
            successEnvelope({
              type: 'object',
              required: ['settings'],
              properties: { settings: { $ref: '#/components/schemas/Settings' } },
            }),
          ),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          403: jsonResponse('Signed in, but not an admin', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
      put: {
        tags: ['Admin'],
        summary: 'Replace the booking rules',
        description: 'Every field is required. Meet & Greet is whole pence; the rest are minutes.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SettingsRequest' } },
          },
        },
        responses: {
          200: jsonResponse(
            'Settings saved',
            successEnvelope({
              type: 'object',
              required: ['settings'],
              properties: { settings: { $ref: '#/components/schemas/Settings' } },
            }),
          ),
          400: jsonResponse('A value is missing, not whole, or out of range', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          403: jsonResponse('Signed in, but not an admin', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/admin/airports': {
      get: {
        tags: ['Admin'],
        summary: 'Every airport',
        description: 'Switched off or not, in list order.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: jsonResponse(
            'All airports',
            successEnvelope({
              type: 'object',
              required: ['airports'],
              properties: {
                airports: { type: 'array', items: { $ref: '#/components/schemas/AdminAirport' } },
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
        summary: 'Add an airport',
        description:
          'The map position is looked up from the main postcode with postcodes.io. Each entry ' +
          'of `postcodes` is tidied ("rh60pj" becomes "RH6 0PJ") and repeats are dropped.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateAirportRequest' } },
          },
        },
        responses: {
          201: jsonResponse(
            'Airport added',
            successEnvelope({
              type: 'object',
              required: ['airport'],
              properties: { airport: { $ref: '#/components/schemas/AdminAirport' } },
            }),
          ),
          400: jsonResponse('A field is missing or wrong, or the main postcode does not exist', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          403: jsonResponse('Signed in, but not an admin', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          409: jsonResponse('Another airport already uses this code', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          503: jsonResponse('The postcode service could not be reached', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/admin/airports/{id}': {
      patch: {
        tags: ['Admin'],
        summary: 'Change an airport, or switch it off or on',
        description:
          'Send only the fields to change. A new main postcode moves the airport on the map. ' +
          'There is no DELETE: `isActive: false` switches an airport off.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/UpdateAirportRequest' } },
          },
        },
        responses: {
          200: jsonResponse(
            'Airport updated',
            successEnvelope({
              type: 'object',
              required: ['airport'],
              properties: { airport: { $ref: '#/components/schemas/AdminAirport' } },
            }),
          ),
          400: jsonResponse('A field is wrong, or nothing was sent', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          403: jsonResponse('Signed in, but not an admin', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          404: jsonResponse('No airport has this id', { $ref: '#/components/schemas/ApiFailure' }),
          409: jsonResponse('Another airport already uses this code', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/places': {
      get: {
        tags: ['Places'],
        summary: 'Suggest addresses for what has been typed',
        description:
          'Public. Up to 8 UK suggestions: our airports first when the text names one (by ' +
          'name or code), then postcodes when the text is a postcode or the ' +
          'start of one (postcodes.io), then addresses, streets, stations and places ' +
          '(Photon, over OpenStreetMap), nearer central London first. If one service is ' +
          'down the other still answers; only when there is nothing to show is it a 503. ' +
          "Each suggestion inside an airport's postcodes carries `airport`.",
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string', minLength: 2, maxLength: 100 },
            example: 'heathrow terminal 5',
          },
        ],
        responses: {
          200: jsonResponse(
            'Suggestions, possibly none',
            successEnvelope({
              type: 'object',
              required: ['places'],
              properties: {
                places: { type: 'array', items: { $ref: '#/components/schemas/PlaceSuggestion' } },
              },
            }),
          ),
          400: jsonResponse('q is missing, shorter than 2 or longer than 100 characters', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          429: { $ref: '#/components/responses/RateLimited' },
          503: jsonResponse('Neither the postcode nor the address service could be reached', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/quotes': {
      post: {
        tags: ['Quotes'],
        summary: 'Price a journey and save the quote',
        description:
          'Public. The "BOOK YOUR JOURNEY" form: a pick-up, up to 5 stops and a drop-off, each ' +
          'as picked from GET /places; a pick-up time; optionally a return time, which adds a ' +
          'second leg that runs the stops backwards; the party. Each leg is measured by road ' +
          "through its stops (OSRM). Each address's postcode is found again from its position " +
          '(postcodes.io), and with it any airport: an airport anywhere on a leg adds the ' +
          'airport fee, and an airport pick-up makes a flight number necessary and offers Meet ' +
          '& Greet (`meetGreetPence`, added per leg at booking). Every class on offer with ' +
          'prices is listed cheapest first, with its original price, discount and price per ' +
          'leg and in total, and whether the party fits; the first that fits is recommended. ' +
          'Rules: the pick-up at least the booking lead time ahead (4 hours), the return after ' +
          'the pick-up, the drop-off not the pick-up, at most 8 passengers, 8 suitcases and 8 ' +
          'hand bags. The answer is saved as a quote that can be booked until `expiresAt`; ' +
          'with no prices published yet, nothing is saved and `quoteId` is null.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/QuoteRequest' } },
          },
        },
        responses: {
          201: jsonResponse(
            'Quote saved',
            successEnvelope({ $ref: '#/components/schemas/QuoteResult' }),
          ),
          200: jsonResponse(
            'No prices are published yet: the journey without options, not saved',
            successEnvelope({ $ref: '#/components/schemas/QuoteResult' }),
          ),
          400: jsonResponse(
            'A field is missing or wrong, a rule is broken, or an address is not in the UK',
            { $ref: '#/components/schemas/ApiFailure' },
          ),
          429: { $ref: '#/components/responses/RateLimited' },
          503: jsonResponse('The postcode or routing service could not be reached', {
            $ref: '#/components/schemas/ApiFailure',
          }),
          500: { $ref: '#/components/responses/Error' },
        },
      },
    },
    '/bookings': {
      post: {
        tags: ['Bookings'],
        summary: 'Book a saved quote',
        security: [{ bearerAuth: [] }],
        description:
          'Signed in. Books the quote at the prices it saved: one journey, or two for a return ' +
          '(the return runs the stops backwards), each PENDING and UNPAID with its own reference ' +
          'like UKR-7F3K9Q. The body names the quote and the car, what was chosen for each leg ' +
          '(a flight number is required for a pick-up at an airport, where Meet & Greet may be ' +
          "added at the quote's price), notes for the driver, and the total the page showed, " +
          'which is compared and never charged. The journeys are held until `expiresAt`: the ' +
          'unpaid expiry (30 minutes), or sooner when the pick-up comes within the booking lead ' +
          'time. Unpaid, they expire; payment follows in Modules 7 and 8. The same customer ' +
          'sending the same quote again while it is held gets the same trip back.',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/BookingRequest' } },
          },
        },
        responses: {
          201: jsonResponse(
            'Booked',
            successEnvelope({
              type: 'object',
              properties: { trip: { $ref: '#/components/schemas/Trip' } },
            }),
          ),
          200: jsonResponse(
            'Already booked by you from this quote: the same trip again',
            successEnvelope({
              type: 'object',
              properties: { trip: { $ref: '#/components/schemas/Trip' } },
            }),
          ),
          400: jsonResponse(
            'A field is missing or wrong: a car not in the quote or too small, a flight number ' +
              'missing or not needed, Meet & Greet away from an airport pick-up, a return field ' +
              'on a one-way journey',
            { $ref: '#/components/schemas/ApiFailure' },
          ),
          401: jsonResponse('Not signed in', { $ref: '#/components/schemas/ApiFailure' }),
          409: jsonResponse(
            'The quote cannot be booked as sent; `details.reason` says why. QUOTE_EXPIRED: run ' +
              'out, unknown, or the pick-up is now inside the booking lead time. QUOTE_USED: ' +
              'booked already, by someone else or no longer held. PRICE_CHANGED: the total sent ' +
              'is not the saved price (`details.totalPence` is). CLASS_UNAVAILABLE: the car was ' +
              'switched off, lost its prices or no longer fits the party. Get a new quote.',
            { $ref: '#/components/schemas/ApiFailure' },
          ),
          429: { $ref: '#/components/responses/RateLimited' },
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
        required: [
          'id',
          'slug',
          'name',
          'description',
          'exampleModels',
          'passengers',
          'suitcases',
          'handLuggage',
          'imageUrl',
        ],
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string', example: 'executive' },
          name: { type: 'string', example: 'Executive' },
          description: { type: 'string' },
          exampleModels: {
            type: 'string',
            example: 'BMW 5 Series, Mercedes E Class, Tesla Model S',
            description: 'Shown as "Cars like ... or similar". Empty when not set.',
          },
          passengers: { type: 'integer', example: 3 },
          suitcases: { type: 'integer', example: 4 },
          handLuggage: { type: 'integer', example: 3 },
          imageUrl: {
            type: 'string',
            format: 'uri',
            nullable: true,
            description: 'null: no picture',
          },
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
          exampleModels: { type: 'string', maxLength: 120, example: 'Mercedes V Class' },
          passengers: { type: 'integer', minimum: 1, maximum: 8, example: 7 },
          suitcases: { type: 'integer', minimum: 0, maximum: 20, example: 5 },
          handLuggage: { type: 'integer', minimum: 0, maximum: 20, example: 7 },
          imageUrl: { type: 'string', format: 'uri', maxLength: 500, nullable: true },
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
          exampleModels: { type: 'string', maxLength: 120 },
          passengers: { type: 'integer', minimum: 1, maximum: 8 },
          suitcases: { type: 'integer', minimum: 0, maximum: 20 },
          handLuggage: { type: 'integer', minimum: 0, maximum: 20 },
          imageUrl: {
            type: 'string',
            format: 'uri',
            maxLength: 500,
            nullable: true,
            description: 'null takes the picture away',
          },
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
          'discountPercent',
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
          discountPercent: {
            type: 'integer',
            minimum: 0,
            maximum: 90,
            example: 10,
            description: 'Taken off the whole fare; the original price is shown struck through',
          },
        },
      },
      SettingsRequest: {
        type: 'object',
        additionalProperties: false,
        required: [
          'meetGreetPence',
          'bookingLeadMinutes',
          'editCutoffMinutes',
          'unpaidExpiryMinutes',
          'driverDetailsMinutes',
          'quoteValidMinutes',
        ],
        properties: {
          meetGreetPence: { type: 'integer', minimum: 0, maximum: 10000, example: 1000 },
          bookingLeadMinutes: { type: 'integer', minimum: 0, maximum: 10080, example: 240 },
          editCutoffMinutes: { type: 'integer', minimum: 0, maximum: 10080, example: 240 },
          unpaidExpiryMinutes: { type: 'integer', minimum: 5, maximum: 1440, example: 30 },
          driverDetailsMinutes: { type: 'integer', minimum: 0, maximum: 1440, example: 60 },
          quoteValidMinutes: { type: 'integer', minimum: 5, maximum: 240, example: 30 },
        },
      },
      Settings: {
        allOf: [
          { $ref: '#/components/schemas/SettingsRequest' },
          {
            type: 'object',
            properties: { updatedAt: { type: 'string', format: 'date-time' } },
          },
        ],
      },
      Config: {
        allOf: [
          { $ref: '#/components/schemas/SettingsRequest' },
          {
            type: 'object',
            required: ['currency', 'limits'],
            properties: {
              currency: { type: 'string', enum: ['GBP'] },
              limits: {
                type: 'object',
                properties: {
                  maxStops: { type: 'integer', example: 5 },
                  maxPassengers: { type: 'integer', example: 8 },
                  maxSuitcases: { type: 'integer', example: 8 },
                  maxHandLuggage: { type: 'integer', example: 8 },
                },
              },
            },
          },
        ],
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
      PlaceSuggestion: {
        type: 'object',
        required: ['label', 'detail', 'latitude', 'longitude', 'postcode', 'kind', 'airport'],
        properties: {
          label: { type: 'string', example: 'Heathrow Terminal 5' },
          detail: {
            type: 'string',
            example: 'Wallis Road, London Borough of Hillingdon, TW6 2GD',
            description: 'The second line. Empty when there is nothing to add.',
          },
          latitude: { type: 'number', example: 51.472515 },
          longitude: { type: 'number', example: -0.4877331 },
          postcode: { type: 'string', nullable: true, example: 'TW6 2GD' },
          kind: {
            type: 'string',
            enum: ['airport', 'postcode', 'address'],
            description: 'airport: one of our own airports, at its main postcode',
          },
          airport: {
            type: 'object',
            nullable: true,
            description: "Set when the place is inside one of our airports' postcodes",
            properties: {
              code: { type: 'string', example: 'LHR' },
              name: { type: 'string', example: 'Heathrow Airport' },
            },
          },
        },
      },
      AdminAirport: {
        type: 'object',
        required: [
          'id',
          'code',
          'name',
          'postcode',
          'latitude',
          'longitude',
          'postcodes',
          'sortOrder',
          'isActive',
        ],
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', example: 'LHR' },
          name: { type: 'string', example: 'Heathrow Airport' },
          postcode: { type: 'string', example: 'TW6 1EW', description: 'The main postcode' },
          latitude: { type: 'number', example: 51.469777 },
          longitude: { type: 'number', example: -0.449559 },
          postcodes: {
            type: 'array',
            items: { type: 'string' },
            example: ['TW6'],
            description: 'Whole postcodes, districts (TW6) or sectors (RH6 0) that also count',
          },
          sortOrder: { type: 'integer', example: 10 },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateAirportRequest: {
        type: 'object',
        required: ['code', 'name', 'postcode'],
        additionalProperties: false,
        properties: {
          code: { type: 'string', pattern: '^[A-Za-z]{3}$', example: 'MAN' },
          name: { type: 'string', minLength: 2, maxLength: 60, example: 'Manchester Airport' },
          postcode: { type: 'string', example: 'M90 1QX' },
          postcodes: {
            type: 'array',
            maxItems: 30,
            items: { type: 'string' },
            example: ['M90 1', 'M90 3'],
          },
          sortOrder: { type: 'integer', minimum: 0, maximum: 9999 },
        },
      },
      UpdateAirportRequest: {
        type: 'object',
        additionalProperties: false,
        minProperties: 1,
        properties: {
          code: { type: 'string', pattern: '^[A-Za-z]{3}$' },
          name: { type: 'string', minLength: 2, maxLength: 60 },
          postcode: { type: 'string' },
          postcodes: { type: 'array', maxItems: 30, items: { type: 'string' } },
          sortOrder: { type: 'integer', minimum: 0, maximum: 9999 },
          isActive: { type: 'boolean' },
        },
        example: { isActive: false },
      },
      QuotePlaceRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['label', 'latitude', 'longitude'],
        properties: {
          label: { type: 'string', maxLength: 200, example: 'Heathrow Airport' },
          latitude: { type: 'number', example: 51.469777 },
          longitude: { type: 'number', example: -0.449559 },
        },
      },
      QuoteRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['pickup', 'dropoff', 'pickupAt', 'passengers'],
        properties: {
          pickup: { $ref: '#/components/schemas/QuotePlaceRequest' },
          stops: {
            type: 'array',
            maxItems: 5,
            items: { $ref: '#/components/schemas/QuotePlaceRequest' },
            description: 'In the order they are driven to',
          },
          dropoff: { $ref: '#/components/schemas/QuotePlaceRequest' },
          pickupAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-11-20T12:30:00Z',
            description: 'With a time zone; at least the booking lead time ahead',
          },
          returnAt: {
            type: 'string',
            format: 'date-time',
            description: 'Makes it a return. After pickupAt.',
          },
          passengers: { type: 'integer', minimum: 1, maximum: 8, example: 2 },
          suitcases: { type: 'integer', minimum: 0, maximum: 8, default: 0, example: 2 },
          handLuggage: { type: 'integer', minimum: 0, maximum: 8, default: 0, example: 2 },
        },
        example: {
          pickup: { label: 'SW1A 1AA, Westminster', latitude: 51.501009, longitude: -0.141588 },
          dropoff: { label: 'Heathrow Airport', latitude: 51.469777, longitude: -0.449559 },
          pickupAt: '2026-11-20T12:30:00Z',
          passengers: 2,
          suitcases: 2,
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
              'DISCOUNT',
              'MEET_AND_GREET',
            ],
          },
          label: { type: 'string', example: '12.4 miles at £2.10 a mile' },
          amountPence: {
            type: 'integer',
            example: 2604,
            description: 'Negative for the discount',
          },
        },
      },
      QuoteAirport: {
        type: 'object',
        nullable: true,
        properties: {
          code: { type: 'string', example: 'LHR' },
          name: { type: 'string', example: 'Heathrow Airport' },
        },
      },
      QuotePlace: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          postcode: { type: 'string', example: 'TW6 1EW' },
          district: { type: 'string', example: 'Hillingdon' },
          airport: { $ref: '#/components/schemas/QuoteAirport' },
        },
      },
      QuoteLeg: {
        type: 'object',
        properties: {
          direction: { type: 'string', enum: ['OUTBOUND', 'RETURN'] },
          pickupAt: { type: 'string', format: 'date-time' },
          places: {
            type: 'array',
            description: 'In driving order: pick-up, stops, drop-off',
            items: { $ref: '#/components/schemas/QuotePlace' },
          },
          distanceMiles: { type: 'number', example: 16.21 },
          durationMinutes: { type: 'integer', example: 34 },
          chargedMiles: { type: 'number', example: 16.2 },
          night: { type: 'boolean', description: 'Pick-up between 22:00 and 06:00 UK time' },
          airport: { type: 'boolean', description: 'An airport anywhere on the leg' },
          airportPickup: {
            allOf: [{ $ref: '#/components/schemas/QuoteAirport' }],
            nullable: true,
            description: 'Set when the leg starts at an airport: flight number, Meet & Greet',
          },
        },
      },
      QuoteOption: {
        type: 'object',
        properties: {
          vehicleType: { $ref: '#/components/schemas/VehicleType' },
          fits: { type: 'boolean', description: 'The party fits this class' },
          recommended: { type: 'boolean' },
          discountPercent: { type: 'integer', example: 10 },
          originalPence: { type: 'integer', example: 4252 },
          discountPence: { type: 'integer', example: 425 },
          pricePence: {
            type: 'integer',
            example: 3827,
            description: 'Original less discount, all legs, without Meet & Greet',
          },
          legs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                lines: { type: 'array', items: { $ref: '#/components/schemas/QuoteLine' } },
                originalPence: { type: 'integer' },
                discountPence: { type: 'integer' },
                pricePence: { type: 'integer' },
              },
            },
          },
        },
      },
      QuoteResult: {
        type: 'object',
        required: ['quoteId', 'expiresAt', 'currency', 'legs', 'party', 'options'],
        properties: {
          quoteId: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            description: 'null when no prices are published yet',
          },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          currency: { type: 'string', enum: ['GBP'] },
          meetGreetPence: { type: 'integer', example: 1000 },
          legs: { type: 'array', items: { $ref: '#/components/schemas/QuoteLeg' } },
          party: {
            type: 'object',
            properties: {
              passengers: { type: 'integer' },
              suitcases: { type: 'integer' },
              handLuggage: { type: 'integer' },
            },
          },
          options: {
            type: 'array',
            description: 'Cheapest first',
            items: { $ref: '#/components/schemas/QuoteOption' },
          },
          recommendedVehicleTypeId: { type: 'string', format: 'uuid', nullable: true },
        },
      },
      BookingRequest: {
        type: 'object',
        required: ['quoteId', 'vehicleTypeId', 'expectedTotalPence'],
        properties: {
          quoteId: { type: 'string', format: 'uuid', description: 'From POST /quotes' },
          vehicleTypeId: {
            type: 'string',
            format: 'uuid',
            description: "One of the quote's options",
          },
          expectedTotalPence: {
            type: 'integer',
            example: 4261,
            description:
              "The total shown on the page: the car's price plus Meet & Greet where chosen. " +
              'Compared with the saved price, never charged',
          },
          outboundFlightNumber: {
            type: 'string',
            example: 'BA117',
            description:
              'Required when the journey starts at an airport, refused otherwise. Spaces and ' +
              'hyphens are ignored',
          },
          outboundMeetGreet: {
            type: 'boolean',
            default: false,
            description: 'Only on a pick-up at an airport',
          },
          returnFlightNumber: {
            type: 'string',
            example: 'BA118',
            description: 'The journey back, when there is one',
          },
          returnMeetGreet: { type: 'boolean', default: false },
          notes: {
            type: 'string',
            maxLength: 500,
            example: 'A child seat, please',
            description: 'For the driver',
          },
        },
      },
      BookedJourney: {
        type: 'object',
        properties: {
          reference: { type: 'string', example: 'UKR-7F3K9Q' },
          direction: { type: 'string', enum: ['OUTBOUND', 'RETURN'] },
          status: {
            type: 'string',
            enum: [
              'PENDING',
              'CONFIRMED',
              'ACCEPTED',
              'ON_ROUTE',
              'ARRIVED',
              'ON_BOARD',
              'COMPLETED',
              'NO_SHOW',
              'CANCELLED',
              'EXPIRED',
            ],
            description: 'A new booking is PENDING',
          },
          paymentStatus: { type: 'string', enum: ['UNPAID', 'PAID'] },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'Still unpaid after this, the journey is let go',
          },
          pickupAt: { type: 'string', format: 'date-time' },
          places: {
            type: 'array',
            description: 'In driving order, as quoted',
            items: { $ref: '#/components/schemas/QuotePlace' },
          },
          distanceMiles: { type: 'number', example: 16.21 },
          durationMinutes: { type: 'integer', example: 34 },
          flightNumber: { type: 'string', nullable: true, example: 'BA117' },
          meetGreet: { type: 'boolean' },
          notes: { type: 'string', nullable: true },
          vehicleType: { $ref: '#/components/schemas/VehicleType' },
          party: {
            type: 'object',
            properties: {
              passengers: { type: 'integer' },
              suitcases: { type: 'integer' },
              handLuggage: { type: 'integer' },
            },
          },
          price: {
            type: 'object',
            description: 'As quoted, plus Meet & Greet where chosen. The lines add up to the total',
            properties: {
              lines: { type: 'array', items: { $ref: '#/components/schemas/QuoteLine' } },
              discountPercent: { type: 'integer', example: 10 },
              originalPence: { type: 'integer', example: 4735 },
              discountPence: { type: 'integer', example: 474 },
              farePence: { type: 'integer', example: 4261 },
              meetGreetPence: { type: 'integer', example: 0 },
              totalPence: { type: 'integer', example: 4261 },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Trip: {
        type: 'object',
        description: 'One press of Book: the journeys booked together from one quote',
        properties: {
          id: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          contact: {
            type: 'object',
            description:
              'Who the journeys are for, as given when booking: the lead passenger, for the ' +
              "driver's name board, and how to reach them",
            properties: {
              firstName: { type: 'string', example: 'Sara' },
              lastName: { type: 'string', example: 'Khan' },
              email: { type: 'string', format: 'email', example: 'sara@example.com' },
              mobile: { type: 'string', example: '+447400123456' },
            },
          },
          currency: { type: 'string', enum: ['GBP'] },
          totalPence: {
            type: 'integer',
            example: 10806,
            description: 'Every journey of the trip',
          },
          expiresAt: { type: 'string', format: 'date-time' },
          bookings: {
            type: 'array',
            description: 'Outbound first',
            items: { $ref: '#/components/schemas/BookedJourney' },
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
