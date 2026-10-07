import { and, asc, count, desc, eq, ne, sql } from 'drizzle-orm';
import {
  LIMITS,
  type CreateProjectInput,
  type Project,
  type UpdateProjectInput,
} from '@todo-zone/shared';
import type { Db } from '../db/client.ts';
import { areas, cards, projects } from '../db/schema.ts';
import { AppError, inboxLocked, notFound } from '../errors.ts';
import { runBatch, withWriteLock } from './lock.ts';

// Project 규칙 (API-SPEC 2, D-016, D-034, D-053, D-062, D-065, D-083).

const nameTaken = () => new AppError(409, 'NAME_TAKEN', '이미 같은 이름의 Project가 있어요.');
const limitReached = () =>
  new AppError(409, 'PROJECT_LIMIT', `Project는 ${LIMITS.projects}개까지 만들 수 있어요.`);

/** 중복 검사용 키: 앞뒤 공백 제거 + 영문 소문자 (D-053). name은 zod가 이미 trim 했다. */
const nameKeyOf = (name: string) => name.trim().toLowerCase();

const columns = {
  id: projects.id,
  name: projects.name,
  areaId: projects.areaId,
  icon: projects.icon,
  isInbox: projects.isInbox,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
};

/** Inbox가 먼저, 나머지는 만든 순서 */
export function listProjects(db: Db): Promise<Project[]> {
  return db
    .select(columns)
    .from(projects)
    .orderBy(desc(projects.isInbox), asc(projects.createdAt), asc(sql`rowid`));
}

async function findProject(db: Db, id: string): Promise<Project> {
  const [found] = await db.select(columns).from(projects).where(eq(projects.id, id));
  if (!found) throw notFound();
  return found;
}

/** Area가 있는지 확인한다. null은 "Area 없음"이라 통과 (D-083) */
async function assertArea(db: Db, areaId: string | null | undefined) {
  if (!areaId) return;
  const [found] = await db.select({ id: areas.id }).from(areas).where(eq(areas.id, areaId));
  if (!found) throw notFound();
}

async function assertNameFree(db: Db, name: string, exceptId?: string) {
  const key = nameKeyOf(name);
  const where = exceptId
    ? and(eq(projects.nameKey, key), ne(projects.id, exceptId))
    : eq(projects.nameKey, key);
  const [clash] = await db.select({ id: projects.id }).from(projects).where(where);
  if (clash) throw nameTaken();
}

export function createProject(db: Db, input: CreateProjectInput): Promise<Project> {
  return withWriteLock(async () => {
    const [{ total }] = (await db.select({ total: count() }).from(projects)) as [{ total: number }];
    if (total >= LIMITS.projects) throw limitReached();
    await assertNameFree(db, input.name);
    await assertArea(db, input.areaId);

    const now = new Date().toISOString();
    const [created] = await db
      .insert(projects)
      .values({
        id: crypto.randomUUID(),
        name: input.name,
        nameKey: nameKeyOf(input.name),
        areaId: input.areaId ?? null,
        icon: input.icon ?? 'folder',
        isInbox: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning(columns);
    return created!;
  });
}

export function updateProject(db: Db, id: string, input: UpdateProjectInput): Promise<Project> {
  return withWriteLock(async () => {
    const project = await findProject(db, id);
    if (project.isInbox) throw inboxLocked();
    if (input.name !== undefined) await assertNameFree(db, input.name, id);
    await assertArea(db, input.areaId);

    const [updated] = await db
      .update(projects)
      .set({
        ...input,
        ...(input.name !== undefined ? { nameKey: nameKeyOf(input.name) } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(projects.id, id))
      .returning(columns);
    return updated!;
  });
}

/** Card를 Inbox로 옮긴 뒤 Project를 지운다. 하나의 batch(트랜잭션)로 처리한다. */
export function deleteProject(db: Db, id: string): Promise<{ movedCards: number }> {
  return withWriteLock(async () => {
    const project = await findProject(db, id);
    if (project.isInbox) throw inboxLocked();

    const [inbox] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.isInbox, true));
    const [{ moved }] = (await db
      .select({ moved: count() })
      .from(cards)
      .where(eq(cards.projectId, id))) as [{ moved: number }];

    await runBatch(db, [
      db
        .update(cards)
        .set({ projectId: inbox!.id, updatedAt: new Date().toISOString() })
        .where(eq(cards.projectId, id)),
      db.delete(projects).where(eq(projects.id, id)),
    ]);
    return { movedCards: moved };
  });
}
