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
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account',
        description:
          'The email is trimmed and lower-cased. The mobile number may come from any country ' +
          'and is stored in international form (+447400123456). The password is stored as a ' +
          'bcrypt hash and is never returned. No token is issued here; sign in with ' +
          '`/auth/login`.',
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
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in',
        description:
          'Checks the email and password and returns the user with a short-lived access ' +
          'token. Send the token on later requests as `Authorization: Bearer <token>`. ' +
          'A wrong password and an unknown email get the same 401, on purpose. ' +
          'Also sets the httpOnly cookie `ukride_refresh`, used by `/auth/refresh` and ' +
          '`/auth/logout`.',
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
          'Always answers 200, so signing out twice is not an error. An access token ' +
          'already issued stays valid until it expires, at most 15 minutes.',
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
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      refreshCookie: { type: 'apiKey', in: 'cookie', name: 'ukride_refresh' },
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'sara@example.com' },
          password: { type: 'string', example: 'secret-pass-1' },
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
        required: ['firstName', 'lastName', 'email', 'mobile', 'password'],
        properties: {
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
        required: ['id', 'firstName', 'lastName', 'email', 'mobile', 'gender', 'createdAt'],
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
          createdAt: { type: 'string', format: 'date-time' },
        },
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
