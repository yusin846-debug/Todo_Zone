import { describe, expect, it } from 'vitest';
import type { Area, Card, Project } from '@todo-zone/shared';
import { doneByArea, doneInQuarter, quarterLabel, quarterOptions } from './review.ts';

const local = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).toISOString();
const project = (
  id: string,
  createdAt = '2026-01-01T00:00:00.000Z',
  areaId: string | null = null,
): Project => ({
  id,
  name: id,
  areaId,
  icon: 'folder',
  isInbox: id === 'inbox',
  createdAt,
  updatedAt: createdAt,
});
const card = (id: string, projectId: string, completedAt: string | null): Card => ({
  id,
  title: id,
  memo: '',
  checklist: [],
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

describe('doneByArea (D-088)', () => {
  it('Area별 완료 수(많은 순)와 그 안의 Project별 수, 막대 비율은 가장 많은 Area 기준', () => {
    const areas: Area[] = [
      { id: 'business', name: 'Business', color: 'gold', createdAt: '2026-01-01', updatedAt: '' },
      { id: 'career', name: 'Career', color: 'mist', createdAt: '2026-01-02', updatedAt: '' },
    ];
    const projects = [
      project('inbox'),
      project('gohaet', '2026-02-01T00:00:00.000Z', 'business'),
      project('cv', '2026-02-02T00:00:00.000Z', 'career'),
      project('study', '2026-02-03T00:00:00.000Z', 'career'),
    ];
    const done = [
      card('1', 'study', local(2026, 10, 1)),
      card('2', 'study', local(2026, 10, 2)),
      card('3', 'cv', local(2026, 10, 3)),
      card('4', 'gohaet', local(2026, 10, 4)),
      card('5', 'inbox', local(2026, 10, 5)),
    ];
    const groups = doneByArea(done, areas, projects);
    expect(groups.map((g) => [g.area?.id ?? null, g.color, g.cards.length, g.ratio])).toEqual([
      ['career', 'mist', 3, 1],
      ['business', 'gold', 1, 1 / 3],
      [null, 'inbox', 1, 1 / 3],
    ]);
    expect(groups[0]!.projects.map((x) => [x.project.id, x.count])).toEqual([
      ['study', 2],
      ['cv', 1],
    ]);
  });
});

describe('quarterLabel', () => {
  it("'2026-Q4' → '2026 Q4'", () => {
    expect(quarterLabel('2026-Q4')).toBe('2026 Q4');
  });
});
