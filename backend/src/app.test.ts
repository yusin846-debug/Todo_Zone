import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.ts';

describe('GET /api/health', () => {
  it('서버가 살아 있으면 status ok를 돌려준다', async () => {
    const res = await request(createApp()).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
