import type { Card, Project } from '@todo-zone/shared';
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

export type ProjectGroup = { project: Project; cards: Card[]; ratio: number };

/** Project별 묶음: 완료 수가 많은 순(같으면 Project 순서), ratio는 가장 많은 Project 대비 */
export function doneByProject(done: Card[], projects: Project[]): ProjectGroup[] {
  const order = [...projects].sort(
    (a, b) => Number(b.isInbox) - Number(a.isInbox) || a.createdAt.localeCompare(b.createdAt),
  );
  const groups = order
    .map((project) => ({ project, cards: done.filter((c) => c.projectId === project.id) }))
    .filter((g) => g.cards.length > 0)
    .sort((a, b) => b.cards.length - a.cards.length);
  const max = groups[0]?.cards.length ?? 1;
  return groups.map((g) => ({ ...g, ratio: g.cards.length / max }));
}

/** '2026-Q4' → '2026 Q4' */
export function quarterLabel(key: string): string {
  return key.replace('-', ' ');
}
