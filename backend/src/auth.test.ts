import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from './app.ts';
import { deploymentAuth, hashPassword } from './auth.ts';
import { openDb } from './db/client.ts';

afterEach(() => vi.useRealTimers());
async function setupAuth() {
  const db = await openDb(':memory:');
  const passwordHash = await hashPassword('test-password-123');
  const api = request(createApp(db, { passwordHash, sessionSecret: 's'.repeat(32), secure: true }));
  return { api, db };
}
const headers = { Host: 'todo.example', Origin: 'https://todo.example' };

describe('개인용 로그인', () => {
  it('배포에서는 로그인 설정이 없으면 중단한다', () => {
    expect(() => deploymentAuth({ VERCEL: '1' })).toThrow();
    expect(deploymentAuth({})).toBeUndefined();
  });
  it('로그인 전 조회와 쓰기 차단, 로그인 후 조회, CSRF 차단과 로그아웃', async () => {
    const { api, db } = await setupAuth();
    try {
      await api.get('/api/board').expect(401);
      await api.post('/api/cards').send({ title: 'x', status: 'todo' }).expect(401);
      await api.get('/api/auth/session').expect(200, { required: true, authenticated: false });
      await api.post('/api/auth/login').set(headers).send({ password: 'wrong' }).expect(401);
      await api
        .post('/api/auth/login')
        .set({ ...headers, Origin: 'https://evil.example' })
        .send({ password: 'test-password-123' })
        .expect(403);
      const logged = await api
        .post('/api/auth/login')
        .set(headers)
        .send({ password: 'test-password-123' })
        .expect(200);
      const raw = logged.headers['set-cookie'] as unknown as string[];
      expect(raw[0]).toContain('HttpOnly');
      expect(raw[0]).toContain('Secure');
      expect(raw[0]).toContain('SameSite=Strict');
      const cookie = raw[0]!.split(';')[0]!;
      const board = await api.get('/api/board').set('Cookie', cookie).expect(200);
      expect(board.headers['cache-control']).toBe('no-store');
      await api
        .post('/api/cards')
        .set({ Host: headers.Host, Cookie: cookie })
        .send({ title: 'x', status: 'todo' })
        .expect(403);
      await api
        .post('/api/cards')
        .set({ ...headers, Cookie: cookie })
        .send({ title: 'x', status: 'todo' })
        .expect(201);
      await api.get('/api/board').set('Cookie', `${cookie}0`).expect(401);
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 8 * 24 * 3600 * 1000);
      await api.get('/api/board').set('Cookie', cookie).expect(401);
      vi.restoreAllMocks();
      const out = await api
        .post('/api/auth/logout')
        .set({ ...headers, Cookie: cookie })
        .expect(204);
      expect((out.headers['set-cookie'] as unknown as string[])[0]).toContain(
        'Expires=Thu, 01 Jan 1970',
      );
      await api.get('/api/board').set('Cookie', cookie).expect(401);
    } finally {
      db.$client.close();
    }
  });
  it('인스턴스를 넘어 DB에 로그인 시도 제한을 저장한다', async () => {
    const { api, db } = await setupAuth();
    try {
      for (let i = 0; i < 10; i++)
        await api.post('/api/auth/login').set(headers).send({ password: 'wrong' }).expect(401);
      await api
        .post('/api/auth/login')
        .set(headers)
        .send({ password: 'test-password-123' })
        .expect(429);
    } finally {
      db.$client.close();
    }
  });
});
