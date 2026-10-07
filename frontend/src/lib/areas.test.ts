import { describe, expect, it } from 'vitest';
import type { Area, Card, Project } from '@todo-zone/shared';
import { colorOf, groupProjects, matchesFilter } from './areas.ts';

const T = '2026-10-01T00:00:00.000Z';
const area = (id: string, color: Area['color'], createdAt = T): Area => ({
  id,
  name: id,
  color,
  createdAt,
  updatedAt: T,
});
const project = (id: string, areaId: string | null, extra: Partial<Project> = {}): Project => ({
  id,
  name: id,
  areaId,
  icon: 'folder',
  isInbox: false,
  createdAt: T,
  updatedAt: T,
  ...extra,
});

const areas = [area('business', 'gold', '2026-01-01'), area('career', 'mist', '2026-01-02')];
const projects = [
  project('inbox', null, { isInbox: true, icon: 'inbox' }),
  project('gohaet', 'business'),
  project('study', 'career', { createdAt: '2026-02-02' }),
  project('cv', 'career', { createdAt: '2026-02-01' }),
  project('loose', null),
];

describe('colorOf (D-086)', () => {
  it('카드 색은 Project의 Area 색, Area가 없거나 Inbox면 크림(inbox)', () => {
    expect(colorOf(projects[1]!, areas)).toBe('gold');
    expect(colorOf(projects[2]!, areas)).toBe('mist');
    expect(colorOf(projects[4]!, areas)).toBe('inbox');
    expect(colorOf(projects[0]!, areas)).toBe('inbox');
  });
});

describe('groupProjects (D-085)', () => {
  it('Area 순서대로 묶고, 안에서는 만든 순서. Area 없는 Project와 Inbox는 맨 끝', () => {
    const groups = groupProjects(areas, projects);
    expect(groups.map((g) => [g.area?.id ?? null, g.projects.map((p) => p.id)])).toEqual([
      ['business', ['gohaet']],
      ['career', ['cv', 'study']],
      [null, ['loose', 'inbox']],
    ]);
  });

  it('Project가 없는 Area도 묶음으로 남는다 (관리 화면에서 필요)', () => {
    const groups = groupProjects([...areas, area('life', 'sage', '2026-01-03')], projects);
    expect(groups.find((g) => g.area?.id === 'life')?.projects).toEqual([]);
  });
});

describe('matchesFilter (D-085)', () => {
  const card = (projectId: string) => ({ projectId }) as Card;
  it('Area 필터는 그 Area의 모든 Project, Project 필터는 그 Project만', () => {
    expect(matchesFilter(card('cv'), { kind: 'area', id: 'career' }, projects)).toBe(true);
    expect(matchesFilter(card('gohaet'), { kind: 'area', id: 'career' }, projects)).toBe(false);
    expect(matchesFilter(card('cv'), { kind: 'project', id: 'cv' }, projects)).toBe(true);
    expect(matchesFilter(card('study'), { kind: 'project', id: 'cv' }, projects)).toBe(false);
    expect(matchesFilter(card('loose'), null, projects)).toBe(true);
  });
});
