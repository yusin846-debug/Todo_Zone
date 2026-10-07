import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { openDb } from '../db/client.ts';
import { cards } from '../db/schema.ts';
import { createCard, listCards, moveCardTo } from './cards.ts';
import { runBatch, withWriteLock } from './lock.ts';

describe('원격 쓰기 transaction 경로', () => {
  it('읽기·순서 변경을 transaction에서 수행하고 실패한 batch는 되돌린다', async () => {
    const folder = mkdtempSync(join(tmpdir(), 'todo-zone-tx-'));
    const db = await openDb(`file:${join(folder, 'test.db').replaceAll('\\', '/')}`);
    // Turso 접속 없이 동일한 Drizzle transaction 경로를 디스크 DB로 검증한다.
    db.$remote = true;
    try {
      const first = await createCard(db, { title: '첫째', status: 'todo' });
      await createCard(db, { title: '둘째', status: 'todo' });
      await moveCardTo(db, first.id, { status: 'doing', afterId: null });
      expect((await listCards(db)).map((card) => [card.title, card.status, card.position])).toEqual(
        [
          ['둘째', 'todo', 0],
          ['첫째', 'doing', 0],
        ],
      );
      await expect(
        withWriteLock(db, async (transaction) => {
          await runBatch(transaction, [
            transaction.update(cards).set({ title: '잘못된 변경' }).where(eq(cards.id, first.id)),
          ]);
          throw new Error('rollback');
        }),
      ).rejects.toThrow('rollback');
      expect((await listCards(db)).find((card) => card.id === first.id)?.title).toBe('첫째');
    } finally {
      db.$client.close();
      try {
        rmSync(folder, { recursive: true });
      } catch (error) {
        // Windows에서 libSQL의 transaction 연결이 파일 핸들을 잠시 유지한다.
        if ((error as NodeJS.ErrnoException).code !== 'EPERM') throw error;
      }
    }
  });
});
