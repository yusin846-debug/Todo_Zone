import { describe, expect, it } from 'vitest';
import type { Card } from '@todo-zone/shared';
import { boardCards, quarterKey, quarterOf } from './quarter.ts';

// 로컬 시간으로 만든 Date. 분기는 사용자 컴퓨터 날짜로 판단한다 (D-071).
const local = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);

describe('quarterOf (D-071)', () => {
  it('달력 분기: 1–3월 Q1 … 10–12월 Q4', () => {
    expect(quarterOf(local(2026, 1, 1))).toEqual({ year: 2026, q: 1 });
    expect(quarterOf(local(2026, 3, 31))).toEqual({ year: 2026, q: 1 });
    expect(quarterOf(local(2026, 9, 30))).toEqual({ year: 2026, q: 3 });
    expect(quarterOf(local(2026, 10, 1))).toEqual({ year: 2026, q: 4 });
    expect(quarterKey(local(2026, 12, 31))).toBe('2026-Q4');
  });
});

describe('boardCards (D-072, D-075)', () => {
  const card = (id: string, status: Card['status'], completedAt: string | null): Card => ({
    id,
    title: id,
    memo: '',
    checklist: [],
    dueDate: null,
    status,
    position: 0,
    projectId: 'p',
    completedAt,
    createdAt: '',
    updatedAt: '',
  });

  it('Todo·Doing은 항상, Done은 이번 분기에 끝낸 것만 Board에 보인다', () => {
    const now = local(2026, 10, 7);
    const cards = [
      card('todo', 'todo', null),
      card('doing', 'doing', null),
      card('q4', 'done', local(2026, 10, 1, 0).toISOString()),
      card('q3', 'done', local(2026, 9, 30, 23).toISOString()),
    ];
    expect(boardCards(cards, now).map((c) => c.id)).toEqual(['todo', 'doing', 'q4']);
  });

  it('분기가 바뀌면 지난 분기 Done은 자동으로 빠진다 (저장 없이 계산)', () => {
    const cards = [card('a', 'done', local(2026, 12, 31, 23).toISOString())];
    expect(boardCards(cards, local(2026, 12, 31, 23))).toHaveLength(1);
    expect(boardCards(cards, local(2027, 1, 1, 0))).toHaveLength(0);
  });
});
