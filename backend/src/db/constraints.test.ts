import { describe, expect, it } from 'vitest';
import { openDb } from './client.ts';

// TEST-PLAN 3: services를 거치지 않고 DB에 직접 써도 제약이 막는지 확인한다.

const NOW = '2026-10-07T00:00:00.000Z';

async function freshDb() {
  const db = await openDb(':memory:');
  const run = (sql: string, args: (string | number)[] = []) => db.$client.execute({ sql, args });
  const inbox = (await run('SELECT id FROM projects WHERE is_inbox = 1')).rows[0]!.id as string;
  const project = (
    id: string,
    name: string,
    isInbox = 0,
    icon = 'folder',
    areaId: string | null = null,
  ) =>
    run(
      'INSERT INTO projects (id, name, name_key, area_id, icon, is_inbox, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, name.toLowerCase(), areaId as string, icon, isInbox, NOW, NOW],
    );
  const area = (id: string, name: string, color = 'mist') =>
    run(
      'INSERT INTO areas (id, name, name_key, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, name.toLowerCase(), color, NOW, NOW],
    );
  const card = (id: string, projectId: string, title = 't', status = 'todo', position = 0) =>
    run(
      'INSERT INTO cards (id, title, memo, status, position, project_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, '', status, position, projectId, NOW, NOW],
    );
  return { run, inbox, project, card, area };
}

describe('DB 제약 (DATA-MODEL 5)', () => {
  it('Inbox는 정확히 1개다', async () => {
    const { run, project } = await freshDb();
    expect((await run('SELECT count(*) AS n FROM projects WHERE is_inbox = 1')).rows[0]!.n).toBe(1);
    await expect(project('i2', 'Inbox2', 1, 'inbox')).rejects.toThrow();
  });

  it('inbox 아이콘은 Inbox 전용이고, Inbox는 Area에 속할 수 없다 (D-083)', async () => {
    const { run, project, area, inbox } = await freshDb();
    await expect(project('p2', 'B', 0, 'inbox')).rejects.toThrow();
    await area('a1', 'Work');
    await expect(
      run('UPDATE projects SET area_id = ? WHERE id = ?', ['a1', inbox]),
    ).rejects.toThrow();
  });

  it('Area 색은 4색만, 기본 Area 4개가 있다 (D-084, D-086)', async () => {
    const { run, area } = await freshDb();
    await expect(area('a1', 'X', 'inbox')).rejects.toThrow();
    await expect(area('a2', 'Y', 'purple')).rejects.toThrow();
    const rows = (await run('SELECT name, color FROM areas ORDER BY created_at')).rows;
    expect(rows.map((r) => `${r.name}:${r.color}`)).toEqual([
      'Business:gold',
      'Career:mist',
      'Ventures:salmon',
      'Life:sage',
    ]);
  });

  it('Area를 지우면 Project는 Area 없음이 된다 (FK SET NULL)', async () => {
    const { run, project, area } = await freshDb();
    await area('a1', 'Work');
    await project('p1', '회사', 0, 'folder', 'a1');
    await run('DELETE FROM areas WHERE id = ?', ['a1']);
    const row = (await run('SELECT area_id FROM projects WHERE id = ?', ['p1'])).rows[0]!;
    expect(row.area_id).toBeNull();
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

  it('Done이면 completed_at이 있어야 하고, Done이 아니면 없어야 한다', async () => {
    const { run, inbox } = await freshDb();
    const insert = (id: string, status: string, completedAt: string | null) =>
      run(
        'INSERT INTO cards (id, title, memo, status, position, project_id, completed_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, 't', '', status, 0, inbox, completedAt as string, NOW, NOW],
      );
    await expect(insert('c1', 'done', null)).rejects.toThrow();
    await expect(insert('c2', 'todo', NOW)).rejects.toThrow();
    await expect(insert('c3', 'done', NOW)).resolves.toBeDefined();
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
