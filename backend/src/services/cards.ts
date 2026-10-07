import { asc, eq, inArray, sql } from 'drizzle-orm';
import {
  addCard,
  moveCard,
  removeCard,
  type Card,
  type CreateCardInput,
  type MoveCardInput,
  type Status,
  type UpdateCardInput,
} from '@todo-zone/shared';
import type { Db } from '../db/client.ts';
import { cards, projects } from '../db/schema.ts';
import { invalid, notFound } from '../errors.ts';
import { runBatch, withWriteLock } from './lock.ts';

// Card 규칙 (API-SPEC 2, DATA-MODEL 4). 순서 계산은 shared/ordering.ts를 frontend와 함께 쓴다.

const STATUS_ORDER = sql`CASE ${cards.status} WHEN 'todo' THEN 0 WHEN 'doing' THEN 1 ELSE 2 END`;

export function listCards(db: Db): Promise<Card[]> {
  return db.select().from(cards).orderBy(STATUS_ORDER, asc(cards.position));
}

async function cardsIn(db: Db, statuses: Status[]): Promise<Card[]> {
  return db
    .select()
    .from(cards)
    .where(inArray(cards.status, statuses))
    .orderBy(STATUS_ORDER, asc(cards.position));
}

async function findCard(db: Db, id: string): Promise<Card> {
  const [card] = await db.select().from(cards).where(eq(cards.id, id));
  if (!card) throw notFound();
  return card;
}

async function inboxId(db: Db): Promise<string> {
  const [inbox] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.isInbox, true));
  return inbox!.id;
}

async function assertProject(db: Db, id: string) {
  const [found] = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, id));
  if (!found) throw notFound();
}

/** before → after 로 바뀐 status·position만 UPDATE 문으로 만든다. */
function positionUpdates(db: Db, before: Card[], after: Card[], now: string) {
  const old = new Map(before.map((c) => [c.id, c]));
  return after
    .filter((c) => {
      const o = old.get(c.id);
      return o && (o.position !== c.position || o.status !== c.status);
    })
    .map((c) =>
      db
        .update(cards)
        .set({
          position: c.position,
          status: c.status,
          completedAt: c.completedAt,
          ...(old.get(c.id)!.status !== c.status ? { updatedAt: now } : {}),
        })
        .where(eq(cards.id, c.id)),
    );
}

export function createCard(db: Db, input: CreateCardInput): Promise<Card> {
  return withWriteLock(async () => {
    const id = input.id ?? crypto.randomUUID();
    const [taken] = await db.select({ id: cards.id }).from(cards).where(eq(cards.id, id));
    if (taken) throw invalid('이미 있는 카드 id예요.');

    const projectId = input.projectId ?? (await inboxId(db));
    if (input.projectId) await assertProject(db, projectId);

    const now = new Date().toISOString();
    const before = await cardsIn(db, [input.status]);
    const after = addCard(before, { id, title: input.title, status: input.status, projectId }, now);
    const created = after.find((c) => c.id === id)!;

    await runBatch(db, [
      ...positionUpdates(db, before, after, now),
      db.insert(cards).values(created),
    ]);
    return created;
  });
}

export function updateCard(db: Db, id: string, input: UpdateCardInput): Promise<Card> {
  return withWriteLock(async () => {
    await findCard(db, id);
    if (input.projectId) await assertProject(db, input.projectId);
    const [updated] = await db
      .update(cards)
      .set({ ...input, updatedAt: new Date().toISOString() })
      .where(eq(cards.id, id))
      .returning();
    return updated!;
  });
}

/** 옮기고, 영향받은 status들의 Card를 position 순으로 돌려준다. */
export function moveCardTo(db: Db, id: string, input: MoveCardInput): Promise<Card[]> {
  return withWriteLock(async () => {
    const card = await findCard(db, id);
    if (input.afterId === id) throw invalid('자기 자신 뒤로는 옮길 수 없어요.');

    const statuses = [...new Set<Status>([card.status, input.status])];
    const before = await cardsIn(db, statuses);
    if (input.afterId !== null) {
      const after = before.find((c) => c.id === input.afterId);
      if (!after || after.status !== input.status) throw notFound();
    }

    const after = moveCard(before, id, input.status, input.afterId, new Date().toISOString());
    await runBatch(db, positionUpdates(db, before, after, new Date().toISOString()));
    return cardsIn(db, statuses);
  });
}

export function deleteCard(db: Db, id: string): Promise<void> {
  return withWriteLock(async () => {
    const card = await findCard(db, id);
    const before = await cardsIn(db, [card.status]);
    const after = removeCard(before, id);
    await runBatch(db, [
      db.delete(cards).where(eq(cards.id, id)),
      ...positionUpdates(db, before, after, new Date().toISOString()),
    ]);
  });
}
