import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { AppError } from '../shared/AppError.js';
import { errorHandler } from './errorHandler.js';
import { rateLimiter } from './rateLimit.js';

/** A tiny app with one limited route, so the limiter is tested on its own. */
function appWith(options: { limit: number; failuresOnly?: boolean }) {
  const app = express();
  const limiter = rateLimiter({
    windowMinutes: 15,
    message: 'Too many attempts.',
    enabled: true,
    ...options,
  });

  app.post('/try', limiter, (req, res) => {
    if (req.query.fail) throw AppError.unauthenticated('wrong');
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

describe('rateLimiter', () => {
  it('allows requests up to the limit, then answers 429 in the error envelope', async () => {
    const app = appWith({ limit: 3 });

    for (let attempt = 1; attempt <= 3; attempt++) {
      expect((await request(app).post('/try')).status).toBe(200);
    }
    const blocked = await request(app).post('/try');

    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many attempts.' },
    });
  });

  it('says when to try again', async () => {
    const app = appWith({ limit: 1 });
    await request(app).post('/try');

    const blocked = await request(app).post('/try');

    const wait = Number(blocked.headers['retry-after']);
    expect(wait).toBeGreaterThan(0);
    expect(wait).toBeLessThanOrEqual(15 * 60);
  });

  it('reports the remaining allowance on every answer', async () => {
    const res = await request(appWith({ limit: 5 })).post('/try');

    expect(res.headers['ratelimit']).toContain('remaining=4');
  });

  it('with failuresOnly, counts wrong attempts and lets correct ones through', async () => {
    const app = appWith({ limit: 2, failuresOnly: true });

    // Successful requests never use up the allowance.
    for (let attempt = 1; attempt <= 5; attempt++) {
      expect((await request(app).post('/try')).status).toBe(200);
    }
    // Two failures are allowed, the third request is refused.
    expect((await request(app).post('/try?fail=1')).status).toBe(401);
    expect((await request(app).post('/try?fail=1')).status).toBe(401);
    expect((await request(app).post('/try?fail=1')).status).toBe(429);
    // Once refused, even a correct attempt has to wait.
    expect((await request(app).post('/try')).status).toBe(429);
  });
});
