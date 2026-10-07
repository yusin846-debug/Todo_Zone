// 날짜는 시간대 없는 'YYYY-MM-DD' 문자열로 다룬다 (D-051). Date 객체는 경계에서만 쓴다.

export type DueKind = 'today' | 'overdue' | 'date';

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

/** 사용자 컴퓨터의 로컬 날짜 → 'YYYY-MM-DD' */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parse(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

export function addDays(key: string, days: number): string {
  const date = parse(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Card의 Due date 표기와 상태 (D-017, D-063). Done 카드는 overdue가 되지 않는다. */
export function dueLabel(
  due: string,
  today: string,
  isDone: boolean,
): { text: string; kind: DueKind } {
  const kind: DueKind =
    due === today && !isDone ? 'today' : due < today && !isDone ? 'overdue' : 'date';
  if (due === today) return { text: '오늘', kind };
  if (due === addDays(today, 1)) return { text: '내일', kind };
  if (due === addDays(today, -1)) return { text: '어제', kind };
  return { text: formatKoreanDate(due), kind };
}

/** '10월 14일 (수)' */
export function formatKoreanDate(key: string): string {
  const date = parse(key);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS_KO[date.getDay()]})`;
}

/** today 이후(오늘 포함) 가장 가까운 weekday(0=일 … 6=토) */
export function nextWeekday(today: string, weekday: number): string {
  const diff = (weekday - parse(today).getDay() + 7) % 7;
  return addDays(today, diff);
}

/** 다음 주(월~일 기준) 월요일 */
export function nextWeekMonday(today: string): string {
  const day = parse(today).getDay(); // 0=일
  return addDays(today, day === 0 ? 1 : 8 - day);
}

/** month(1~12)의 달력 칸 42개: 그 달 1일이 든 주의 일요일부터 6주 */
export function monthGrid(year: number, month: number): string[] {
  const first = new Date(year, month - 1, 1);
  const start = toDateKey(new Date(year, month - 1, 1 - first.getDay()));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Hero 인사말 (D-064) */
export function greeting(hour: number): string {
  if (hour >= 5 && hour <= 11) return 'Good morning.';
  if (hour >= 12 && hour <= 17) return 'Good afternoon.';
  return 'Good evening.';
}

/** Hero eyebrow: 'WEDNESDAY, OCTOBER 7' */
export function eyebrowDate(today: string): string {
  return parse(today)
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase();
}
