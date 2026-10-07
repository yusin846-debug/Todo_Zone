import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from './schema.ts';

const MIGRATIONS = resolve(dirname(fileURLToPath(import.meta.url)), '../../drizzle');

export type Db = Awaited<ReturnType<typeof openDb>>;
export type Store = Pick<Db, 'select' | 'insert' | 'update' | 'delete'> &
  Partial<Pick<Db, 'batch' | 'transaction' | '$remote'>>;

/**
 * DB를 열고 마이그레이션을 적용한다.
 * - `file:` 주소면 폴더를 만든다. 테스트는 `:memory:`를 쓴다.
 * - FK(ON DELETE RESTRICT, D-055)가 동작하도록 foreign_keys를 켠다.
 *   libsql 로컬 클라이언트는 transaction()을 쓰면 연결을 새로 만들어서 이 설정과
 *   메모리 DB가 사라진다. 그래서 services는 transaction() 대신 batch()로 원자적 쓰기를 한다.
 */
export async function openDb(url: string, authToken?: string, applyMigrations = true) {
  if (url.startsWith('file:') && !url.includes(':memory:')) {
    mkdirSync(dirname(resolve(url.slice('file:'.length))), { recursive: true });
  }
  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });
  if (applyMigrations) await migrate(db, { migrationsFolder: MIGRATIONS });
  await client.execute('PRAGMA foreign_keys = ON');
  return Object.assign(db, { $client: client, $remote: url.startsWith('libsql://') });
}
