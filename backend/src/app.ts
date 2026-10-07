import express from 'express';
import type { HealthResponse } from '@todo-zone/shared';

// 서버 설정과 라우트만 담당한다. 포트에 붙이는 일은 index.ts가 한다 (테스트에서 app만 쓰기 위해).
export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    const body: HealthResponse = { status: 'ok' };
    res.json(body);
  });

  return app;
}
