import type { BatchItem } from 'drizzle-orm/batch';
import type { Store } from '../db/client.ts';

// 쓰기 작업을 한 번에 하나씩 처리한다.
// services는 "읽기 → 순서 계산 → batch 쓰기"로 동작하는데, 빠른 드래그로 요청이 겹치면
// 두 요청이 같은 옛 순서를 읽고 덮어써서 순번이 꼬일 수 있다. 서버 프로세스가 하나뿐이라
// (로컬 전용, ADR-0002) 프로세스 안 잠금으로 충분하다.

let tail: Promise<unknown> = Promise.resolve();

export function withWriteLock<T>(db: Store, work: (db: Store) => Promise<T>): Promise<T> {
  // 원격 DB는 읽기·계산·쓰기를 하나의 write transaction으로 묶는다.
  // 여러 Vercel 인스턴스가 동시에 같은 순번을 읽는 일을 막는다.
  if (db.$remote && db.transaction) return db.transaction((tx) => work(tx));
  const run = tail.then(
    () => work(db),
    () => work(db),
  );
  tail = run.catch(() => undefined);
  return run;
}

/** 여러 쓰기를 하나의 트랜잭션(batch)으로 실행한다. 비어 있으면 아무것도 하지 않는다. */
export async function runBatch(db: Store, items: BatchItem<'sqlite'>[]): Promise<void> {
  if (items.length === 0) return;
  if (db.batch) await db.batch(items as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
  else for (const item of items) await item; // transaction 내부에서는 같은 연결의 query를 실행한다
}
