import { describe, expect, it } from 'vitest';
import { openDb } from './client.ts';

// TEST-PLAN 3: services를 거치지 않고 DB에 직접 써도 제약이 막는지 확인한다.

const NOW = '2026-10-07T00:00:00.000Z';

async function freshDb() {
  const db = await openDb(':memory:');
  const run = (sql: string, args: (string | number)[] = []) => db.$client.execute({ sql, args });
  const inbox = (await run('SELECT id FROM projects WHERE is_inbox = 1')).rows[0]!.id as string;
  const project = (id: string, name: string, color = 'mist', isInbox = 0, icon = 'folder') =>
    run(
      'INSERT INTO projects (id, name, name_key, color, icon, is_inbox, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, name.toLowerCase(), color, icon, isInbox, NOW, NOW],
    );
  const card = (id: string, projectId: string, title = 't', status = 'todo', position = 0) =>
    run(
      'INSERT INTO cards (id, title, memo, status, position, project_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, '', status, position, projectId, NOW, NOW],
    );
  return { run, inbox, project, card };
}

describe('DB 제약 (DATA-MODEL 5)', () => {
  it('Inbox는 정확히 1개다', async () => {
    const { run, project } = await freshDb();
    expect((await run('SELECT count(*) AS n FROM projects WHERE is_inbox = 1')).rows[0]!.n).toBe(1);
    await expect(project('i2', 'Inbox2', 'inbox', 1, 'inbox')).rejects.toThrow();
  });

  it('inbox 색·아이콘은 Inbox 전용이고, 모르는 색은 거부한다', async () => {
    const { project } = await freshDb();
    await expect(project('p1', 'A', 'inbox')).rejects.toThrow();
    await expect(project('p2', 'B', 'mist', 0, 'inbox')).rejects.toThrow();
    await expect(project('p3', 'C', 'purple')).rejects.toThrow();
  });

  it('Card가 남은 Project는 DB에서 바로 지울 수 없다 (FK RESTRICT)', async () => {
    const { run, project, card } = await freshDb();
    await project('p1', '학교');
    await card('c1', 'p1');
    await expect(run('DELETE FROM projects WHERE id = ?', ['p1'])).rejects.toThrow();
  });

  it('없는 Project를 가리키는 Card는 만들 수 없다', async () => {
    const { card } = await freshDb();
    await expect(card('c1', 'missing')).rejects.toThrow();
  });

  it('제목 길이, status, position 규칙 밖의 값은 거부한다', async () => {
    const { card, inbox } = await freshDb();
    await expect(card('c1', inbox, '')).rejects.toThrow();
    await expect(card('c2', inbox, '가'.repeat(101))).rejects.toThrow();
    await expect(card('c3', inbox, 't', 'later')).rejects.toThrow();
    await expect(card('c4', inbox, 't', 'todo', -1)).rejects.toThrow();
    await expect(card('c5', inbox, '가'.repeat(100))).resolves.toBeDefined();
  });
});
