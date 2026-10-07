import express from 'express';
import type { Db } from './db/client.ts';
import { errorHandler } from './errors.ts';
import { apiRoutes } from './routes.ts';

// 서버 설정만 담당한다. 포트에 붙이는 일은 index.ts가 한다 (테스트에서 app만 쓰기 위해).
export function createApp(db: Db) {
  const app = express();
  app.use(express.json());
  app.use('/api', apiRoutes(db));
  app.use(errorHandler);
  return app;
}
