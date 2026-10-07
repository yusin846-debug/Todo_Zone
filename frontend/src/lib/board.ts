import { PROJECT_COLORS, type Card, type ProjectColor, type Status } from '@todo-zone/shared';

// Board의 순수 로직. 화면과 서버 어느 쪽에도 묶이지 않는다.
// 순서 규칙은 docs/DATA-MODEL.md 4장, 크기 단계는 docs/SCREEN-SPEC.md S1.

export type CardTier = 'focus' | 'l' | 'm' | 's' | 'done';

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
    dueDate: null,
    position: 0,
    createdAt: now,
    updatedAt: now,
  };
  const next = [...cards, created];
  return renumber(next, { [input.status]: [input.id, ...idsOf(cards, input.status)] });
}

/**
 * 카드를 toStatus 열에서 afterId 카드 바로 뒤로 옮긴다. afterId가 null이면 맨 위.
 * 필터 중이라도 afterId는 보이는 카드의 id이고, 끼우는 위치는 status 전체 순서 기준이다 (DATA-MODEL 4).
 */
export function moveCard(
  cards: Card[],
  cardId: string,
  toStatus: Status,
  afterId: string | null,
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

  const moved = cards.map((c) => (c.id === cardId ? { ...c, status: toStatus } : c));
  return renumber(moved, order);
}

/** 크기 단계 (D-060): Done > Focus > L(메모) > M(마감일) > S */
export function cardTier(card: Card, isFocus: boolean): CardTier {
  if (card.status === 'done') return 'done';
  if (isFocus) return 'focus';
  if (card.memo.trim() !== '') return 'l';
  if (card.dueDate !== null) return 'm';
  return 's';
}

/** Hero 요약 (D-064). Board 전체 기준, Done은 마감 계산에서 뺀다. */
export function summarize(cards: Card[], today: string) {
  const open = cards.filter((c) => c.status !== 'done' && c.dueDate !== null);
  return {
    doing: cards.filter((c) => c.status === 'doing').length,
    dueToday: open.filter((c) => c.dueDate === today).length,
    overdue: open.filter((c) => c.dueDate! < today).length,
  };
}

/** Project 진행률 (D-020) */
export function progressOf(cards: Card[], projectId: string) {
  const mine = cards.filter((c) => c.projectId === projectId);
  const done = mine.filter((c) => c.status === 'done').length;
  return { done, total: mine.length, ratio: mine.length === 0 ? 0 : done / mine.length };
}

/** n번째 일반 Project의 색 (Inbox 제외, 4색 순환, D-042) */
export function nextProjectColor(nonInboxCount: number): ProjectColor {
  return PROJECT_COLORS[nonInboxCount % PROJECT_COLORS.length]!;
}
