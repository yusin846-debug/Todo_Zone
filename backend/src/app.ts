import express from 'express';
import type { Db } from './db/client.ts';
import { errorHandler } from './errors.ts';
import { apiRoutes } from './routes.ts';
import { authHandlers, type AuthConfig } from './auth.ts';

// 서버 설정만 담당한다. 포트에 붙이는 일은 index.ts가 한다 (테스트에서 app만 쓰기 위해).
export function createApp(db: Db, auth?: AuthConfig) {
  const app = express();
  app.use(express.json());
  if (auth) {
    const handlers = authHandlers(db, auth);
    app.get('/api/auth/session', handlers.session);
    app.post('/api/auth/login', handlers.login);
    app.post('/api/auth/logout', handlers.logout);
    app.use('/api', handlers.guard);
  } else {
    app.get('/api/auth/session', (_req, res) =>
      res.set('Cache-Control', 'no-store').json({ required: false, authenticated: true }),
    );
  }
  app.use('/api', apiRoutes(db));
  app.use(errorHandler);
  return app;
}
