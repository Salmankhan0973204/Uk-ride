import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../app.js';

// The database is replaced by a fake, so these tests run without PostgreSQL.
const queryRaw = vi.hoisted(() => vi.fn());
vi.mock('../../config/db.js', () => ({ prisma: { $queryRaw: queryRaw } }));

beforeEach(() => {
  queryRaw.mockReset().mockResolvedValue([{ '?column?': 1 }]);
});

describe('GET /api/v1/health', () => {
  it('returns the success envelope with service info', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ status: 'ok', service: 'ukride-api', env: 'test' });
    expect(typeof res.body.data.uptimeSeconds).toBe('number');
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('exposes liveness and readiness', async () => {
    const live = await request(app).get('/api/v1/health/live');
    const ready = await request(app).get('/api/v1/health/ready');

    expect(live.status).toBe(200);
    expect(live.body.data.status).toBe('live');
    expect(ready.status).toBe(200);
    expect(ready.body.data.status).toBe('ready');
    expect(ready.body.data.checks.database.status).toBe('up');
  });

  it('answers 503 on readiness when the database is down, while liveness stays 200', async () => {
    queryRaw.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:5432'));

    const ready = await request(app).get('/api/v1/health/ready');
    const live = await request(app).get('/api/v1/health/live');

    expect(ready.status).toBe(503);
    expect(ready.body.success).toBe(false);
    expect(ready.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(ready.body.error.details.checks.database.status).toBe('down');
    expect(JSON.stringify(ready.body)).not.toContain('ECONNREFUSED');
    expect(live.status).toBe(200);
  });

  it('reuses a safe caller-supplied request id', async () => {
    const res = await request(app).get('/api/v1/health/live').set('x-request-id', 'abc-123');

    expect(res.headers['x-request-id']).toBe('abc-123');
  });
});

describe('error handling', () => {
  it('returns the error envelope for an unknown route', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(typeof res.body.requestId).toBe('string');
    expect(res.body.requestId).toBe(res.headers['x-request-id']);
  });

  it('returns 400 for malformed JSON instead of a 500', async () => {
    const res = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('only allows configured CORS origins', async () => {
    const allowed = await request(app).get('/api/v1/health').set('Origin', 'http://localhost:3000');
    const blocked = await request(app).get('/api/v1/health').set('Origin', 'http://evil.test');

    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });
});
