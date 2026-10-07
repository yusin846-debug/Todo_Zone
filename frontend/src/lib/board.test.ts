import { describe, expect, it } from 'vitest';
import type { Card } from '@todo-zone/shared';
import {
  addCard,
  cardTier,
  columnCards,
  moveCard,
  nextProjectColor,
  progressOf,
  summarize,
} from './board.ts';

const TODAY = '2026-10-07';

function card(
  id: string,
  status: Card['status'],
  position: number,
  extra: Partial<Card> = {},
): Card {
  return {
    id,
    title: id,
    memo: '',
    dueDate: null,
    status,
    position,
    projectId: 'p1',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...extra,
  };
}

/** status별로 id를 순서대로 */
function layout(cards: Card[]) {
  const ids = (s: Card['status']) => columnCards(cards, s, null).map((c) => c.id);
  return { todo: ids('todo'), doing: ids('doing'), done: ids('done') };
}

/** 모든 status의 position이 0부터 빈틈없는지 (D-049) */
function positionsAreDense(cards: Card[]) {
  return (['todo', 'doing', 'done'] as const).every((s) =>
    columnCards(cards, s, null).every((c, i) => c.position === i),
  );
}

const base = [
  card('a', 'todo', 0),
  card('b', 'todo', 1, { projectId: 'p2' }),
  card('c', 'todo', 2),
  card('d', 'doing', 0),
];

describe('columnCards', () => {
  it('position 순서로 돌려주고, 필터가 있으면 그 Project만', () => {
    expect(columnCards(base, 'todo', null).map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(columnCards(base, 'todo', 'p2').map((c) => c.id)).toEqual(['b']);
  });
});

describe('addCard (D-018, D-013)', () => {
  it('새 카드는 그 열의 맨 위에 들어가고 순번이 다시 매겨진다', () => {
    const next = addCard(
      base,
      { id: 'n', title: '새 카드', status: 'todo', projectId: 'p1' },
      '2026-10-07T00:00:00.000Z',
    );
    expect(layout(next).todo).toEqual(['n', 'a', 'b', 'c']);
    expect(positionsAreDense(next)).toBe(true);
  });
});

describe('moveCard (DATA-MODEL 4)', () => {
  it('같은 열 안에서 뒤로 옮긴다', () => {
    const next = moveCard(base, 'a', 'todo', 'c');
    expect(layout(next).todo).toEqual(['b', 'c', 'a']);
    expect(positionsAreDense(next)).toBe(true);
  });

  it('afterId가 null이면 맨 위로 간다', () => {
    expect(layout(moveCard(base, 'c', 'todo', null)).todo).toEqual(['c', 'a', 'b']);
  });

  it('다른 열로 옮기면 양쪽 순번이 모두 빈틈없다', () => {
    const next = moveCard(base, 'b', 'doing', 'd');
    expect(layout(next)).toEqual({ todo: ['a', 'c'], doing: ['d', 'b'], done: [] });
    expect(positionsAreDense(next)).toBe(true);
    expect(next.find((c) => c.id === 'b')?.status).toBe('doing');
  });

  it('빈 열로도 옮길 수 있다', () => {
    const next = moveCard(base, 'a', 'done', null);
    expect(layout(next).done).toEqual(['a']);
    expect(positionsAreDense(next)).toBe(true);
  });

  it('필터 중에는 보이는 카드 바로 뒤에 끼운다 (전체 순서 기준)', () => {
    // 화면에는 p1만 보임: todo = [a, c]. d를 a 뒤로 → 전체로는 a 바로 뒤(= b 앞)
    const next = moveCard(base, 'd', 'todo', 'a');
    expect(layout(next).todo).toEqual(['a', 'd', 'b', 'c']);
  });

  it('원본 배열을 바꾸지 않는다', () => {
    const before = JSON.stringify(base);
    moveCard(base, 'a', 'doing', null);
    expect(JSON.stringify(base)).toBe(before);
  });
});

describe('cardTier (D-060)', () => {
  it('Done이 가장 우선이고, Focus → L → M → S 순서로 정해진다', () => {
    expect(cardTier(card('x', 'done', 0, { memo: '메모' }), true)).toBe('done');
    expect(cardTier(card('x', 'doing', 0), true)).toBe('focus');
    expect(cardTier(card('x', 'todo', 0, { memo: '메모' }), false)).toBe('l');
    expect(cardTier(card('x', 'todo', 0, { dueDate: TODAY }), false)).toBe('m');
    expect(cardTier(card('x', 'todo', 0), false)).toBe('s');
  });

  it('공백뿐인 메모는 메모가 없는 것으로 본다', () => {
    expect(cardTier(card('x', 'todo', 0, { memo: '  \n ' }), false)).toBe('s');
  });
});

describe('summarize (D-064)', () => {
  it('진행 중, 오늘 마감(Done 제외), 지난 마감(Done 제외)을 센다', () => {
    const cards = [
      card('1', 'doing', 0),
      card('2', 'doing', 1, { dueDate: TODAY }),
      card('3', 'todo', 0, { dueDate: '2026-10-06' }),
      card('4', 'done', 0, { dueDate: '2026-10-01' }),
      card('5', 'done', 1, { dueDate: TODAY }),
    ];
    expect(summarize(cards, TODAY)).toEqual({ doing: 2, dueToday: 1, overdue: 1 });
  });
});

describe('progressOf (D-020)', () => {
  it('Done 수 / 전체 수, 0장이면 0%', () => {
    const cards = [
      card('1', 'done', 0),
      card('2', 'todo', 0),
      card('3', 'todo', 1, { projectId: 'p2' }),
    ];
    expect(progressOf(cards, 'p1')).toEqual({ done: 1, total: 2, ratio: 0.5 });
    expect(progressOf(cards, 'p9')).toEqual({ done: 0, total: 0, ratio: 0 });
  });
});

describe('nextProjectColor (D-042)', () => {
  it('4색을 순서대로 돌아가며 쓴다 (Inbox 제외)', () => {
    expect(nextProjectColor(0)).toBe('mist');
    expect(nextProjectColor(3)).toBe('salmon');
    expect(nextProjectColor(4)).toBe('mist');
  });
});
