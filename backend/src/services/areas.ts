import { and, asc, count, eq, ne, sql } from 'drizzle-orm';
import {
  LIMITS,
  nextAreaColor,
  type Area,
  type CreateAreaInput,
  type UpdateAreaInput,
} from '@todo-zone/shared';
import type { Db } from '../db/client.ts';
import { areas, projects } from '../db/schema.ts';
import { AppError, notFound } from '../errors.ts';
import { runBatch, withWriteLock } from './lock.ts';

// Area 규칙 (API-SPEC, D-083, D-084, D-086). 이름 규칙은 Project와 같다 (D-053).

const nameKeyOf = (name: string) => name.trim().toLowerCase();

const columns = {
  id: areas.id,
  name: areas.name,
  color: areas.color,
  createdAt: areas.createdAt,
  updatedAt: areas.updatedAt,
};

/** 만든 순서 (태그 줄과 Review의 순서) */
export function listAreas(db: Db): Promise<Area[]> {
  return db
    .select(columns)
    .from(areas)
    .orderBy(asc(areas.createdAt), asc(sql`rowid`));
}

async function findArea(db: Db, id: string): Promise<Area> {
  const [found] = await db.select(columns).from(areas).where(eq(areas.id, id));
  if (!found) throw notFound();
  return found;
}

async function assertNameFree(db: Db, name: string, exceptId?: string) {
  const key = nameKeyOf(name);
  const where = exceptId
    ? and(eq(areas.nameKey, key), ne(areas.id, exceptId))
    : eq(areas.nameKey, key);
  const [clash] = await db.select({ id: areas.id }).from(areas).where(where);
  if (clash) throw new AppError(409, 'NAME_TAKEN', '이미 같은 이름의 Area가 있어요.');
}

export function createArea(db: Db, input: CreateAreaInput): Promise<Area> {
  return withWriteLock(async () => {
    const [{ total }] = (await db.select({ total: count() }).from(areas)) as [{ total: number }];
    if (total >= LIMITS.areas)
      throw new AppError(409, 'PROJECT_LIMIT', `Area는 ${LIMITS.areas}개까지 만들 수 있어요.`);
    await assertNameFree(db, input.name);

    const now = new Date().toISOString();
    const [created] = await db
      .insert(areas)
      .values({
        id: crypto.randomUUID(),
        name: input.name,
        nameKey: nameKeyOf(input.name),
        color: input.color ?? nextAreaColor(total),
        createdAt: now,
        updatedAt: now,
      })
      .returning(columns);
    return created!;
  });
}

export function updateArea(db: Db, id: string, input: UpdateAreaInput): Promise<Area> {
  return withWriteLock(async () => {
    await findArea(db, id);
    if (input.name !== undefined) await assertNameFree(db, input.name, id);
    const [updated] = await db
      .update(areas)
      .set({
        ...input,
        ...(input.name !== undefined ? { nameKey: nameKeyOf(input.name) } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(areas.id, id))
      .returning(columns);
    return updated!;
  });
}

/** Area를 지우면 그 Project는 Area 없음(크림)이 된다. Card는 그대로 (D-084) */
export function deleteArea(db: Db, id: string): Promise<{ unassignedProjects: number }> {
  return withWriteLock(async () => {
    await findArea(db, id);
    const [{ n }] = (await db
      .select({ n: count() })
      .from(projects)
      .where(eq(projects.areaId, id))) as [{ n: number }];
    // FK가 SET NULL이지만, 의도를 분명히 하려고 직접 비운 뒤 지운다
    await runBatch(db, [
      db.update(projects).set({ areaId: null }).where(eq(projects.areaId, id)),
      db.delete(areas).where(eq(areas.id, id)),
    ]);
    return { unassignedProjects: n };
  });
}
