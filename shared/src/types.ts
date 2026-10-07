import type { AreaColor, ProjectIcon, Status } from './constants.ts';

export type HealthResponse = { status: 'ok' };

// docs/DATA-MODEL.md 2장의 행 모양. API 응답도 이 모양을 쓴다.
export type Area = {
  id: string;
  name: string;
  color: AreaColor;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  areaId: string | null; // D-083. Inbox는 항상 null
  icon: ProjectIcon;
  isInbox: boolean;
  createdAt: string; // UTC ISO 8601
  updatedAt: string;
};

export type ChecklistEntry = { id: string; text: string; checked: boolean };

export type Card = {
  id: string;
  title: string;
  memo: string;
  checklist: ChecklistEntry[];
  dueDate: string | null; // YYYY-MM-DD, 시간대 없음 (D-051)
  status: Status;
  position: number; // status 안에서 0부터 빈틈없이 (D-049)
  projectId: string;
  completedAt: string | null; // Done에 들어간 UTC 시각. Done일 때만 값이 있다 (D-072)
  createdAt: string;
  updatedAt: string;
};
