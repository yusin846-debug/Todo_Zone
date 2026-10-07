import type { Request, Response } from 'express';
import { createApp } from '../backend/src/app.ts';
import { deploymentAuth } from '../backend/src/auth.ts';
import { openDb } from '../backend/src/db/client.ts';

let app: Promise<ReturnType<typeof createApp>> | undefined;
function initialize() {
  const auth = deploymentAuth({ ...process.env, VERCEL: '1' });
  if (!process.env.DATABASE_URL?.startsWith('libsql://') || !process.env.DATABASE_AUTH_TOKEN) {
    throw new Error('Turso DATABASE_URL / DATABASE_AUTH_TOKEN 설정이 필요합니다.');
  }
  return openDb(process.env.DATABASE_URL, process.env.DATABASE_AUTH_TOKEN, false).then((db) =>
    createApp(db, auth),
  );
}

export default async function handler(req: Request, res: Response) {
  try {
    app ??= initialize();
    (await app)(req, res);
  } catch {
    app = undefined;
    res.status(503).json({ error: { code: 'INTERNAL', message: '서버 설정을 확인해 주세요.' } });
  }
}
