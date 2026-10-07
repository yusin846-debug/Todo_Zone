import { describe, expect, it } from 'vitest';
import { addDays, dueLabel, eyebrowDate, greeting, toDateKey } from './dates.ts';

const TODAY = '2026-10-07'; // 수요일

describe('toDateKey', () => {
  it('로컬 날짜를 YYYY-MM-DD로 만든다 (자정 직전도 같은 날)', () => {
    expect(toDateKey(new Date(2026, 9, 7, 23, 59))).toBe('2026-10-07');
    expect(toDateKey(new Date(2026, 0, 5, 0, 0))).toBe('2026-01-05');
  });
});

describe('addDays', () => {
  it('월과 해를 넘겨도 날짜 문자열로 계산한다', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('dueLabel (D-017, D-063)', () => {
  it('오늘·내일·어제는 말로 표시한다', () => {
    expect(dueLabel(TODAY, TODAY, false)).toEqual({ text: '오늘', kind: 'today' });
    expect(dueLabel('2026-10-08', TODAY, false)).toEqual({ text: '내일', kind: 'date' });
    expect(dueLabel('2026-10-06', TODAY, false)).toEqual({ text: '어제', kind: 'overdue' });
  });

  it('그 외에는 "10월 9일 (금)" 형식이다', () => {
    expect(dueLabel('2026-10-09', TODAY, false).text).toBe('10월 9일 (금)');
  });

  it('Done 카드는 마감일이 지나도 overdue가 아니다', () => {
    expect(dueLabel('2026-10-01', TODAY, true).kind).toBe('date');
  });
});

describe('greeting', () => {
  it('시간대별 인사말 (D-064)', () => {
    expect(greeting(5)).toBe('Good morning.');
    expect(greeting(11)).toBe('Good morning.');
    expect(greeting(12)).toBe('Good afternoon.');
    expect(greeting(17)).toBe('Good afternoon.');
    expect(greeting(18)).toBe('Good evening.');
    expect(greeting(2)).toBe('Good evening.');
  });
});

describe('eyebrowDate', () => {
  it('영어 대문자 날짜', () => {
    expect(eyebrowDate(TODAY)).toBe('WEDNESDAY, OCTOBER 7');
  });
});
