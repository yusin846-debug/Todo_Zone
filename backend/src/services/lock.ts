import type { BatchItem } from 'drizzle-orm/batch';
import type { Db } from '../db/client.ts';

// 쓰기 작업을 한 번에 하나씩 처리한다.
// services는 "읽기 → 순서 계산 → batch 쓰기"로 동작하는데, 빠른 드래그로 요청이 겹치면
// 두 요청이 같은 옛 순서를 읽고 덮어써서 순번이 꼬일 수 있다. 서버 프로세스가 하나뿐이라
// (로컬 전용, ADR-0002) 프로세스 안 잠금으로 충분하다.

let tail: Promise<unknown> = Promise.resolve();

export function withWriteLock<T>(work: () => Promise<T>): Promise<T> {
  const run = tail.then(work, work);
  tail = run.catch(() => undefined);
  return run;
}

/** 여러 쓰기를 하나의 트랜잭션(batch)으로 실행한다. 비어 있으면 아무것도 하지 않는다. */
export async function runBatch(db: Db, items: BatchItem<'sqlite'>[]): Promise<void> {
  if (items.length === 0) return;
  await db.batch(items as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
}
