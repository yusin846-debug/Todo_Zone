import type { Card } from '@todo-zone/shared';

// 분기 계산 (D-071, D-072, ADR-0007). 아카이브 여부는 저장하지 않고 완료 시각으로 계산한다.
// 모든 계산은 사용자 컴퓨터의 로컬 날짜 기준이다.

export type Quarter = { year: number; q: 1 | 2 | 3 | 4 };

export function quarterOf(date: Date): Quarter {
  return { year: date.getFullYear(), q: (Math.floor(date.getMonth() / 3) + 1) as Quarter['q'] };
}

/** '2026-Q4' */
export function quarterKey(date: Date): string {
  const { year, q } = quarterOf(date);
  return `${year}-Q${q}`;
}

/** Board에 보이는 Card: Todo·Doing 전부 + 이번 분기에 끝낸 Done (D-075) */
export function boardCards(cards: Card[], now: Date): Card[] {
  const current = quarterKey(now);
  return cards.filter(
    (c) =>
      c.status !== 'done' ||
      (c.completedAt !== null && quarterKey(new Date(c.completedAt)) === current),
  );
}
