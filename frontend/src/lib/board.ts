import type { Card } from '@todo-zone/shared';

// Board의 화면용 순수 로직. 순서 규칙(columnCards, addCard, moveCard 등)은 backend와
// 함께 쓰도록 shared/src/ordering.ts에 있다.
export { addCard, columnCards, moveCard, removeCard } from '@todo-zone/shared';

export type CardTier = 'focus' | 'l' | 'm' | 's' | 'done';

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
