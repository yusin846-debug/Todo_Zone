import type { Area, Card, CardColor, Project } from '@todo-zone/shared';
import { groupProjects } from './areas.ts';
import { quarterKey } from './quarter.ts';

// Quarterly Review 계산 (PRD F11, SCREEN-SPEC S5). 분기는 사용자 컴퓨터 날짜 기준 (D-071).

const keyOfDone = (c: Card) => (c.completedAt ? quarterKey(new Date(c.completedAt)) : null);

/** 완료 기록이 있는 분기 + 이번 분기, 오래된 순 ('2026-Q3' 형식은 문자열 정렬 = 시간 순) */
export function quarterOptions(cards: Card[], now: Date): string[] {
  const keys = new Set<string>([quarterKey(now)]);
  for (const c of cards) {
    const k = c.status === 'done' ? keyOfDone(c) : null;
    if (k) keys.add(k);
  }
  return [...keys].sort();
}

/** 그 분기에 끝낸 카드, 최근에 끝낸 것부터 */
export function doneInQuarter(cards: Card[], key: string): Card[] {
  return cards
    .filter((c) => c.status === 'done' && keyOfDone(c) === key)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));
}

export type AreaGroup = {
  area: Area | null; // null = Area 없음(Unsorted, Inbox 포함)
  color: CardColor;
  cards: Card[];
  ratio: number; // 가장 많이 끝낸 Area 대비
  projects: { project: Project; count: number }[];
};

/**
 * Area별 묶음 (D-088): 완료 수가 많은 순(같으면 Area 순서), 안에는 Project별 수.
 * 카드는 최근에 끝낸 순서를 유지한다.
 */
export function doneByArea(done: Card[], areas: Area[], projects: Project[]): AreaGroup[] {
  const groups = groupProjects(areas, projects)
    .map((g) => {
      const ids = new Set(g.projects.map((p) => p.id));
      const cards = done.filter((c) => ids.has(c.projectId));
      const counts = g.projects
        .map((project) => ({
          project,
          count: cards.filter((c) => c.projectId === project.id).length,
        }))
        .filter((x) => x.count > 0)
        .sort((a, b) => b.count - a.count);
      return {
        area: g.area,
        color: (g.area?.color ?? 'inbox') as CardColor,
        cards,
        projects: counts,
      };
    })
    .filter((g) => g.cards.length > 0)
    .sort((a, b) => b.cards.length - a.cards.length);
  const max = groups[0]?.cards.length ?? 1;
  return groups.map((g) => ({ ...g, ratio: g.cards.length / max }));
}

/** '2026-Q4' → '2026 Q4' */
export function quarterLabel(key: string): string {
  return key.replace('-', ' ');
}
