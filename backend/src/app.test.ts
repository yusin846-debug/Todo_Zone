import { describe, expect, it } from 'vitest';
import { setup } from './test-helpers.ts';

describe('GET /api/health', () => {
  it('서버가 살아 있으면 status ok를 돌려준다', async () => {
    const { api } = await setup();
    const res = await api.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('없는 API 경로는 404 NOT_FOUND', async () => {
    const { api } = await setup();
    const res = await api.get('/api/nope').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
