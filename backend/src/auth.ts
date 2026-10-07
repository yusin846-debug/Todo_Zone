import { createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { Request, RequestHandler } from 'express';
import type { Db } from './db/client.ts';

const scrypt = promisify(nodeScrypt);
const COOKIE = 'todo_zone_session';
const TTL = 7 * 24 * 3600;
export type AuthConfig = { passwordHash: string; sessionSecret: string; secure: boolean };

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const digest = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${digest.toString('hex')}`;
}

export function deploymentAuth(env = process.env): AuthConfig | undefined {
  const required = env.VERCEL === '1' || env.AUTH_ENABLED === 'true';
  if (!required) return undefined;
  if (
    !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(env.AUTH_PASSWORD_HASH ?? '') ||
    (env.AUTH_SESSION_SECRET?.length ?? 0) < 32
  ) {
    throw new Error('로그인 환경 변수 AUTH_PASSWORD_HASH / AUTH_SESSION_SECRET가 필요합니다.');
  }
  return {
    passwordHash: env.AUTH_PASSWORD_HASH!,
    sessionSecret: env.AUTH_SESSION_SECRET!,
    secure: env.VERCEL === '1',
  };
}

export function authHandlers(db: Db, config: AuthConfig) {
  const sign = (payload: string) =>
    createHmac('sha256', config.sessionSecret)
      .update(`${payload}:${config.passwordHash}`)
      .digest('hex');
  const authenticated = async (req: Request) => {
    const cookie = req.headers.cookie
      ?.split(';')
      .map((v) => v.trim())
      .find((v) => v.startsWith(`${COOKIE}=`))
      ?.slice(COOKIE.length + 1);
    if (!cookie) return false;
    const [expires, nonce, signature, extra] = cookie.split('.');
    if (
      !expires ||
      !nonce ||
      !signature ||
      extra ||
      !/^\d+$/.test(expires) ||
      !/^[a-f0-9]{32}$/.test(nonce) ||
      !/^[a-f0-9]{64}$/.test(signature)
    )
      return false;
    const now = Math.floor(Date.now() / 1000);
    if (Number(expires) <= now || Number(expires) > now + TTL) return false;
    if (
      !timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(sign(`${expires}.${nonce}`), 'hex'),
      )
    )
      return false;
    const session = await db.$client.execute({
      sql: 'SELECT id FROM auth_sessions WHERE id = ? AND expires_at > ?',
      args: [nonce, now],
    });
    return session.rows.length === 1;
  };
  const sameOrigin = (req: Request) => {
    const origin = req.get('origin');
    if (!origin) return false;
    try {
      return new URL(origin).host === req.get('host');
    } catch {
      return false;
    }
  };
  const cookieOptions = {
    httpOnly: true,
    secure: config.secure,
    sameSite: 'strict' as const,
    path: '/',
  };
  const unauthorized = (res: Parameters<RequestHandler>[1]) =>
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: '로그인이 필요해요.' } });
  const guard: RequestHandler = async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!(await authenticated(req))) {
      unauthorized(res);
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method) && !sameOrigin(req)) {
      res
        .status(403)
        .json({ error: { code: 'UNAUTHORIZED', message: '허용되지 않은 요청이에요.' } });
      return;
    }
    next();
  };
  const login: RequestHandler = async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!sameOrigin(req)) {
      res
        .status(403)
        .json({ error: { code: 'UNAUTHORIZED', message: '허용되지 않은 요청이에요.' } });
      return;
    }
    if (typeof req.body?.password !== 'string' || req.body.password.length > 1024) {
      unauthorized(res);
      return;
    }
    const now = Date.now();
    // DB에 시도 수를 저장해 서버리스 인스턴스 사이에도 제한을 공유한다.
    const attempt = await db.$client.execute({
      sql: `INSERT INTO auth_attempts (id, count, reset_at) VALUES ('owner', 1, ?)
        ON CONFLICT(id) DO UPDATE SET count = CASE WHEN reset_at <= ? THEN 1 ELSE count + 1 END,
        reset_at = CASE WHEN reset_at <= ? THEN excluded.reset_at ELSE reset_at END RETURNING count`,
      args: [now + 15 * 60 * 1000, now, now],
    });
    if (Number(attempt.rows[0]!.count) > 10) {
      res
        .set('Retry-After', '900')
        .status(429)
        .json({
          error: { code: 'UNAUTHORIZED', message: '시도가 많아요. 15분 후 다시 로그인해 주세요.' },
        });
      return;
    }
    const [, salt, expected] = config.passwordHash.split(':');
    const digest = (await scrypt(req.body.password, salt!, 64)) as Buffer;
    if (!timingSafeEqual(digest, Buffer.from(expected!, 'hex'))) {
      unauthorized(res);
      return;
    }
    await db.$client.execute("DELETE FROM auth_attempts WHERE id = 'owner'");
    const expires = Math.floor(Date.now() / 1000) + TTL;
    const nonce = randomBytes(16).toString('hex');
    await db.$client.batch(
      [
        {
          sql: 'DELETE FROM auth_sessions WHERE expires_at <= ?',
          args: [Math.floor(Date.now() / 1000)],
        },
        { sql: 'INSERT INTO auth_sessions (id, expires_at) VALUES (?, ?)', args: [nonce, expires] },
      ],
      'write',
    );
    const payload = `${expires}.${nonce}`;
    res
      .cookie(COOKIE, `${payload}.${sign(payload)}`, { ...cookieOptions, maxAge: TTL * 1000 })
      .json({ authenticated: true });
  };
  const logout: RequestHandler = async (req, res) => {
    if (!sameOrigin(req)) {
      res.sendStatus(403);
      return;
    }
    const cookie = req.headers.cookie
      ?.split(';')
      .map((v) => v.trim())
      .find((v) => v.startsWith(`${COOKIE}=`))
      ?.slice(COOKIE.length + 1);
    if (cookie && (await authenticated(req))) {
      await db.$client.execute({
        sql: 'DELETE FROM auth_sessions WHERE id = ?',
        args: [cookie.split('.')[1]!],
      });
    }
    res.clearCookie(COOKIE, cookieOptions).sendStatus(204);
  };
  const session: RequestHandler = async (req, res) => {
    res
      .set('Cache-Control', 'no-store')
      .json({ required: true, authenticated: await authenticated(req) });
  };
  return { guard, login, logout, session };
}
