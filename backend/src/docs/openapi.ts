import { APP_VERSION } from '../config/env.js';

const errorCodes = [
  'BAD_REQUEST',
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
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
  tags: [{ name: 'Health', description: 'Service status checks' }],
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
        },
      },
    },
  },
  components: {
    schemas: {
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
          status: { type: 'string', example: 'skipped' },
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
    },
  },
};
