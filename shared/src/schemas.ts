import { z } from 'zod';
import { AREA_COLORS, LIMITS, PROJECT_ICONS, STATUSES, charCount } from './constants.ts';

// API 요청의 형태와 입력 제한 (docs/API-SPEC.md). message는 화면에 그대로 보여 줄 한글 문장이다.

const withinChars = (max: number) => (s: string) => charCount(s) <= max;

const cardTitle = z
  .string({ error: '제목을 입력해 주세요.' })
  .trim()
  .min(1, '제목을 입력해 주세요.')
  .refine(withinChars(LIMITS.cardTitle), `제목은 ${LIMITS.cardTitle}자까지 쓸 수 있어요.`);

const cardMemo = z
  .string({ error: '메모 형식이 올바르지 않아요.' })
  .trim()
  .refine(withinChars(LIMITS.cardMemo), '메모는 2,000자까지 쓸 수 있어요.');

/** 실제로 있는 날짜인지까지 본다 (2026-02-30 거부). */
function isRealDate(key: string): boolean {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m! - 1 && date.getUTCDate() === d;
}

const dueDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않아요.')
  .refine(isRealDate, '날짜 형식이 올바르지 않아요.')
  .nullable();

const status = z.enum(STATUSES, { error: 'Status 값이 올바르지 않아요.' });
const id = z.string().min(1, 'id가 올바르지 않아요.');

const projectName = z
  .string({ error: 'Project 이름을 입력해 주세요.' })
  .trim()
  .min(1, 'Project 이름을 입력해 주세요.')
  .refine(withinChars(LIMITS.projectName), 'Project 이름은 30자까지 쓸 수 있어요.');

const areaColor = z.enum(AREA_COLORS, { error: '고를 수 없는 색이에요.' });
const areaName = z
  .string({ error: 'Area 이름을 입력해 주세요.' })
  .trim()
  .min(1, 'Area 이름을 입력해 주세요.')
  .refine(withinChars(LIMITS.areaName), `Area 이름은 ${LIMITS.areaName}자까지 쓸 수 있어요.`);
const projectIcon = z.enum(PROJECT_ICONS, { error: '고를 수 없는 아이콘이에요.' });

const nonEmpty = (o: object) => Object.keys(o).length > 0;

export const createCardInput = z.strictObject({
  id: z.uuid('id가 올바르지 않아요.').optional(),
  title: cardTitle,
  status,
  projectId: id.optional(),
});

export const updateCardInput = z
  .strictObject({
    title: cardTitle,
    memo: cardMemo,
    dueDate,
    projectId: id,
  })
  .partial()
  .refine(nonEmpty, '바꿀 내용이 없어요.');

export const moveCardInput = z.strictObject({
  status,
  afterId: id.nullable(),
});

export const createProjectInput = z.strictObject({
  name: projectName,
  icon: projectIcon.optional(),
  areaId: id.nullable().optional(),
});

export const updateProjectInput = z
  .strictObject({ name: projectName, icon: projectIcon, areaId: id.nullable() })
  .partial()
  .refine(nonEmpty, '바꿀 내용이 없어요.');

export const createAreaInput = z.strictObject({
  name: areaName,
  color: areaColor.optional(),
});

export const updateAreaInput = z
  .strictObject({ name: areaName, color: areaColor })
  .partial()
  .refine(nonEmpty, '바꿀 내용이 없어요.');

export type CreateAreaInput = z.infer<typeof createAreaInput>;
export type UpdateAreaInput = z.infer<typeof updateAreaInput>;
export type CreateCardInput = z.infer<typeof createCardInput>;
export type UpdateCardInput = z.infer<typeof updateCardInput>;
export type MoveCardInput = z.infer<typeof moveCardInput>;
export type CreateProjectInput = z.infer<typeof createProjectInput>;
export type UpdateProjectInput = z.infer<typeof updateProjectInput>;

export type ApiErrorCode =
  'VALIDATION' | 'INBOX_LOCKED' | 'NOT_FOUND' | 'NAME_TAKEN' | 'PROJECT_LIMIT' | 'INTERNAL';

export type ApiError = { error: { code: ApiErrorCode; message: string } };
