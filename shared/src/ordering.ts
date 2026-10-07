import { AREA_COLORS, type AreaColor, type Status } from './constants.ts';
import type { Card } from './types.ts';

// Card 순서 규칙 (docs/DATA-MODEL.md 4장). frontend의 낙관적 변경과 backend의 저장이
// 같은 코드를 써서 결과가 어긋나지 않게 한다. 테스트: frontend/src/lib/board.test.ts

/** 한 status의 카드를 position 순서로. projectFilter가 있으면 그 Project만 (D-033). */
export function columnCards(cards: Card[], status: Status, projectFilter: string | null): Card[] {
  return cards
    .filter((c) => c.status === status && (projectFilter === null || c.projectId === projectFilter))
    .sort((a, b) => a.position - b.position);
}

/** status별로 position을 0부터 다시 매긴다. order에 없는 status는 그대로 둔다. */
function renumber(cards: Card[], order: Partial<Record<Status, string[]>>): Card[] {
  const pos = new Map<string, number>();
  for (const ids of Object.values(order)) ids?.forEach((id, i) => pos.set(id, i));
  return cards.map((c) => (pos.has(c.id) ? { ...c, position: pos.get(c.id)! } : c));
}

function idsOf(cards: Card[], status: Status): string[] {
  return columnCards(cards, status, null).map((c) => c.id);
}

/** 새 카드를 그 status의 맨 위에 넣는다 (D-013, D-018). */
export function addCard(
  cards: Card[],
  input: { id: string; title: string; status: Status; projectId: string },
  now: string,
): Card[] {
  const created: Card = {
    ...input,
    memo: '',
    checklist: [],
    dueDate: null,
    position: 0,
    completedAt: input.status === 'done' ? now : null, // D-072
    createdAt: now,
    updatedAt: now,
  };
  const next = [...cards, created];
  return renumber(next, { [input.status]: [input.id, ...idsOf(cards, input.status)] });
}

/**
 * 카드를 toStatus 열에서 afterId 카드 바로 뒤로 옮긴다. afterId가 null이면 맨 위.
 * 필터 중이라도 afterId는 보이는 카드의 id이고, 끼우는 위치는 status 전체 순서 기준이다.
 * Done에 들어가면 completedAt = now, Done에서 나가면 null. Done 안의 이동은 그대로 (D-072).
 */
export function moveCard(
  cards: Card[],
  cardId: string,
  toStatus: Status,
  afterId: string | null,
  now: string,
): Card[] {
  const moving = cards.find((c) => c.id === cardId);
  if (!moving || afterId === cardId) return cards;

  const fromStatus = moving.status;
  const target = idsOf(cards, toStatus).filter((id) => id !== cardId);
  const insertAt = afterId === null ? 0 : target.indexOf(afterId) + 1;
  target.splice(insertAt, 0, cardId);

  const order: Partial<Record<Status, string[]>> = { [toStatus]: target };
  if (fromStatus !== toStatus)
    order[fromStatus] = idsOf(cards, fromStatus).filter((id) => id !== cardId);

  const completedAt = toStatus !== 'done' ? null : fromStatus === 'done' ? moving.completedAt : now;
  const moved = cards.map((c) => (c.id === cardId ? { ...c, status: toStatus, completedAt } : c));
  return renumber(moved, order);
}

/** 카드를 빼고 그 status의 순번을 당긴다. */
export function removeCard(cards: Card[], cardId: string): Card[] {
  const removing = cards.find((c) => c.id === cardId);
  if (!removing) return cards;
  const rest = cards.filter((c) => c.id !== cardId);
  return renumber(rest, { [removing.status]: idsOf(rest, removing.status) });
}

/** n번째 Area의 기본 색 (4색 순환, D-084) */
export function nextAreaColor(areaCount: number): AreaColor {
  return AREA_COLORS[areaCount % AREA_COLORS.length]!;
}
