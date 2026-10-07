import { describe, expect, it } from 'vitest';
import type { Card, Project } from '@todo-zone/shared';
import { doneByProject, doneInQuarter, quarterLabel, quarterOptions } from './review.ts';

const local = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).toISOString();
const project = (id: string, createdAt = '2026-01-01T00:00:00.000Z'): Project => ({
  id,
  name: id,
  color: 'mist',
  icon: 'folder',
  isInbox: id === 'inbox',
  createdAt,
  updatedAt: createdAt,
});
const card = (id: string, projectId: string, completedAt: string | null): Card => ({
  id,
  title: id,
  memo: '',
  dueDate: null,
  status: completedAt ? 'done' : 'todo',
  position: 0,
  projectId,
  completedAt,
  createdAt: '',
  updatedAt: '',
});

const NOW = new Date(2026, 9, 7, 12); // 2026 Q4

describe('quarterOptions (F11)', () => {
  it('완료 기록이 있는 분기 + 이번 분기, 오래된 순', () => {
    const cards = [
      card('a', 'p', local(2026, 3, 10)),
      card('b', 'p', local(2026, 8, 1)),
      card('c', 'p', null),
    ];
    expect(quarterOptions(cards, NOW)).toEqual(['2026-Q1', '2026-Q3', '2026-Q4']);
  });

  it('기록이 없어도 이번 분기는 있다', () => {
    expect(quarterOptions([], NOW)).toEqual(['2026-Q4']);
  });
});

describe('doneInQuarter', () => {
  it('그 분기에 끝낸 카드만, 최근에 끝낸 것부터', () => {
    const cards = [
      card('early', 'p', local(2026, 10, 1)),
      card('late', 'p', local(2026, 10, 7)),
      card('q3', 'p', local(2026, 9, 30)),
      card('open', 'p', null),
    ];
    expect(doneInQuarter(cards, '2026-Q4').map((c) => c.id)).toEqual(['late', 'early']);
  });
});

describe('doneByProject', () => {
  it('완료 수가 많은 순, 같으면 Project 순서. 막대 비율은 가장 많은 Project 기준', () => {
    const projects = [
      project('inbox'),
      project('a', '2026-02-01T00:00:00.000Z'),
      project('b', '2026-03-01T00:00:00.000Z'),
    ];
    const done = [
      card('1', 'b', local(2026, 10, 1)),
      card('2', 'b', local(2026, 10, 2)),
      card('3', 'a', local(2026, 10, 3)),
    ];
    const groups = doneByProject(done, projects);
    expect(groups.map((g) => [g.project.id, g.cards.length, g.ratio])).toEqual([
      ['b', 2, 1],
      ['a', 1, 0.5],
    ]);
  });
});

describe('quarterLabel', () => {
  it("'2026-Q4' → '2026 Q4'", () => {
    expect(quarterLabel('2026-Q4')).toBe('2026 Q4');
  });
});
