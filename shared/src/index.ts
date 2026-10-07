// frontend와 backend가 함께 쓰는 규칙의 단일 출처 (D-037).
// 값의 근거는 docs/DATA-MODEL.md, docs/DECISIONS.md를 따른다.

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

// D-062: Lucide 아이콘 이름. 새 Project 기본값은 'folder', 'inbox'는 Inbox 전용.
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
] as const;
export type ProjectIcon = (typeof PROJECT_ICONS)[number] | 'inbox';

/** 사람이 보는 글자 수 (유니코드 코드 포인트). str.length는 이모지를 2로 센다 (DATA-MODEL 3). */
export function charCount(text: string): number {
  return [...text].length;
}

export type HealthResponse = { status: 'ok' };

// docs/DATA-MODEL.md 2장의 행 모양. API 응답도 이 모양을 쓴다.
export type Project = {
  id: string;
  name: string;
  color: ProjectColor;
  icon: ProjectIcon;
  isInbox: boolean;
  createdAt: string; // UTC ISO 8601
  updatedAt: string;
};

export type Card = {
  id: string;
  title: string;
  memo: string;
  dueDate: string | null; // YYYY-MM-DD, 시간대 없음 (D-051)
  status: Status;
  position: number; // status 안에서 0부터 빈틈없이 (D-049)
  projectId: string;
  createdAt: string;
  updatedAt: string;
};
