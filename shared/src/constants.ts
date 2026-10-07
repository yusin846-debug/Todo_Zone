// 공통 상수. 값의 근거는 docs/DATA-MODEL.md, docs/DECISIONS.md를 따른다.

export const LIMITS = {
  cardTitle: 100, // D-031
  cardMemo: 2000, // D-031
  projectName: 30, // D-065
  projects: 20, // D-034 (Inbox 포함)
} as const;

export const STATUSES = ['todo', 'doing', 'done'] as const; // D-010
export type Status = (typeof STATUSES)[number];

export const PROJECT_COLORS = ['mist', 'gold', 'sage', 'salmon'] as const; // D-057
export type ProjectColor = (typeof PROJECT_COLORS)[number] | 'inbox';

// D-062, D-078: 아이콘 이름 (Lucide 24개 + 직접 그린 gimbap). 새 Project 기본값은 'folder', 'inbox'는 Inbox 전용.
export const PROJECT_ICONS = [
  'folder',
  'book-open',
  'graduation-cap',
  'briefcase',
  'laptop',
  'code',
  'pen-tool',
  'palette',
  'music',
  'dumbbell',
  'footprints',
  'heart',
  'users',
  'house',
  'shopping-bag',
  'utensils',
  'wallet',
  'plane',
  'car',
  'gamepad-2',
  'camera',
  'sprout',
  'star',
  'coffee',
  'gimbap', // 직접 그린 아이콘 (D-078). Lucide에 없음
] as const;
export type ProjectIcon = (typeof PROJECT_ICONS)[number] | 'inbox';

/** 사람이 보는 글자 수 (유니코드 코드 포인트). str.length는 이모지를 2로 센다 (DATA-MODEL 3). */
export function charCount(text: string): number {
  return [...text].length;
}
