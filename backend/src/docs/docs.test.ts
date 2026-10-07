import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../app.js';

describe('API docs', () => {
  it('serves the OpenAPI document', async () => {
    const res = await request(app).get('/api/v1/docs/openapi.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(Object.keys(res.body.paths)).toEqual([
      '/health',
      '/health/live',
      '/health/ready',
      '/auth/register',
      '/auth/login',
      '/auth/refresh',
      '/auth/logout',
      '/auth/me',
    ]);
  });

  it('serves the Swagger UI page', async () => {
    const res = await request(app).get('/api/v1/docs/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('swagger-ui');
  });
});
