import { createHash, randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import {
  addCard,
  moveCard,
  agentContent,
  type AgentChange,
  type AgentReply,
  type AgentApplied,
  type AgentChatInput,
  type AgentApproveInput,
  type AgentContent,
  type Card,
} from '@todo-zone/shared';
import type { Db, Store } from '../db/client.ts';
import { agentTurns, cards, projects } from '../db/schema.ts';
import { listCards } from '../services/cards.ts';
import { listProjects } from '../services/projects.ts';
import { listAreas } from '../services/areas.ts';
import { runBatch, withWriteLock } from '../services/lock.ts';
import { AppError, invalid } from '../errors.ts';
import { modelPlan, type AgentPlanner, type PlannerContext } from './model.ts';

const TTL = 30 * 60 * 1000;
const conflict = (
  message = '검토 중 내용이 바뀌었어요. 새 대화에서 최신 Card로 변경안을 다시 만들어 주세요.',
) => new AppError(409, 'CONFLICT', message);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
function content(card: Card): AgentContent {
  return agentContent.parse({
    title: card.title,
    memo: card.memo,
    dueDate: card.dueDate,
    projectId: card.projectId,
    status: card.status,
    checklist: card.checklist,
  });
}
async function latest(db: Store, conversationId: string) {
  return (
    await db
      .select()
      .from(agentTurns)
      .where(eq(agentTurns.conversationId, conversationId))
      .orderBy(desc(agentTurns.version))
      .limit(1)
  )[0];
}

/** Additive, idempotent setup also supports Vercel's no-file-migrations runtime. */
export async function ensureAgentTables(db: Db) {
  await db.$client.batch(
    [
      `CREATE TABLE IF NOT EXISTS agent_turns (id TEXT PRIMARY KEY NOT NULL, conversation_id TEXT NOT NULL, version INTEGER NOT NULL, payload TEXT NOT NULL, expires_at INTEGER NOT NULL, approval_hash TEXT, result TEXT)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS agent_conversation_version ON agent_turns (conversation_id, version)`,
      `CREATE TABLE IF NOT EXISTS agent_limits (id TEXT PRIMARY KEY NOT NULL, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)`,
    ],
    'write',
  );
}

async function consumeQuota(db: Db) {
  const now = Date.now();
  // Durable limits work across Vercel instances. Failed requests also consume a slot.
  for (const [id, window, limit] of [
    ['hour', 3600000, 60],
    ['day', 86400000, 200],
  ] as const) {
    const result = await db.$client.execute({
      sql: `INSERT INTO agent_limits (id, count, reset_at) VALUES (?, 1, ?)
        ON CONFLICT(id) DO UPDATE SET count = CASE WHEN reset_at <= ? THEN 1 ELSE count + 1 END,
        reset_at = CASE WHEN reset_at <= ? THEN excluded.reset_at ELSE reset_at END RETURNING count`,
      args: [id, now + window, now, now],
    });
    if (Number(result.rows[0]!.count) > limit)
      throw new AppError(
        429,
        'RATE_LIMIT',
        'AI 요청 한도에 도달했어요. 잠시 후 다시 시도해 주세요.',
      );
  }
}

export async function prepareChanges(
  db: Db,
  input: AgentChatInput,
  planner: AgentPlanner,
): Promise<AgentReply> {
  const previous = await latest(db, input.conversationId);
  if ((previous?.version ?? 0) !== input.expectedVersion) throw conflict();
  if (previous && previous.expiresAt <= Date.now())
    throw conflict('대화가 만료됐어요. 새 대화를 시작해 주세요.');
  const [boardCards, boardProjects, boardAreas] = await Promise.all([
    listCards(db),
    listProjects(db),
    listAreas(db),
  ]);
  const board = { cards: boardCards, projects: boardProjects, areas: boardAreas };
  if (boardCards.length > 500 || JSON.stringify(board).length > 160000)
    throw invalid('Board가 커서 한 번에 읽기 어려워요. Card 내용을 줄인 뒤 다시 시도해 주세요.');
  const messages = [
    ...(previous?.payload.messages ?? []),
    ...(previous?.result
      ? [
          {
            role: 'assistant' as const,
            content: `이전 변경안은 사용자가 DONE으로 적용했습니다. 적용 Card id: ${previous.result.cardIds.join(', ')}. 다시 적용하지 않습니다.`,
          },
        ]
      : []),
    { role: 'user' as const, content: input.message },
  ].slice(-12);
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: input.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  let pending = previous && !previous.result ? previous.payload.response.changes : [];
  if (input.draft) {
    if (new Set(input.draft.map((item) => item.id)).size !== input.draft.length)
      throw invalid('변경 항목이 중복됐어요.');
    pending = input.draft
      .filter((item) => item.selected)
      .map((item) => {
        const change = pending.find((change) => change.id === item.id);
        if (!change) throw invalid('변경안을 확인하지 못했어요.');
        return { ...change, after: { ...change.after, title: item.title } };
      });
  }
  const context: PlannerContext = { board, messages, pending, today, timezone: input.timezone };
  await consumeQuota(db);
  const output = modelPlan.parse(await planner(context));
  if (output.clarification && output.changes.length)
    throw invalid('확인이 필요한 변경안이에요. 대상을 구체적으로 알려 주세요.');
  const seen = new Set<string>();
  const changes: AgentChange[] = [];
  for (const proposal of output.changes) {
    const before =
      proposal.cardId === null ? null : boardCards.find((card) => card.id === proposal.cardId);
    if (proposal.cardId !== null && !before)
      throw invalid('변경 대상 Card를 확인하지 못했어요. 제목과 Project를 알려 주세요.');
    if (proposal.cardId && seen.has(proposal.cardId))
      throw invalid('동일 Card의 변경안을 하나로 정리해 다시 요청해 주세요.');
    if (proposal.cardId) seen.add(proposal.cardId);
    const inbox = boardProjects.find((project) => project.isInbox)!;
    const after: AgentContent = before
      ? content(before)
      : {
          title: proposal.title ?? '',
          memo: '',
          dueDate: null,
          projectId: inbox.id,
          status: 'todo',
          checklist: [],
        };
    for (const field of new Set(proposal.fields)) {
      const value = proposal[field];
      if (field === 'dueDate') after.dueDate = proposal.dueDate;
      else if (field === 'checklist') {
        if (!proposal.checklist) throw invalid('체크리스트 변경안 형식이 올바르지 않아요.');
        after.checklist = proposal.checklist.map((entry) => {
          if (entry.id && !before?.checklist.some((old) => old.id === entry.id))
            throw invalid('체크리스트 항목을 확인하지 못했어요.');
          return { ...entry, id: entry.id ?? randomUUID() };
        });
      } else if (field === 'status') {
        if (proposal.status !== null) after.status = proposal.status;
      } else if (value !== null) {
        (after as unknown as Record<string, unknown>)[field] = value;
      }
    }
    const checked = agentContent.parse(after);
    const project = boardProjects.find((p) => p.id === checked.projectId);
    if (!project) throw invalid('Project를 확인하지 못했어요. 현재 Project 이름을 알려 주세요.');
    if (before && same(content(before), checked)) continue;
    changes.push({
      id: randomUUID(),
      cardId: before?.id ?? randomUUID(),
      before: before ?? null,
      after: checked,
      kind: !before
        ? 'create'
        : before.status !== 'done' && checked.status === 'done'
          ? 'complete'
          : 'update',
      projectName: project.name,
      projectUpdatedAt: project.updatedAt,
    });
  }
  const response: AgentReply = {
    conversationId: input.conversationId,
    version: input.expectedVersion + 1,
    reply: output.reply,
    clarification: output.clarification,
    changes,
    expiresAt: Date.now() + TTL,
  };
  await withWriteLock(db, async (store) => {
    const current = await latest(store, input.conversationId);
    // Approval may have happened while inference was in flight; never resurrect it.
    if (
      (current?.version ?? 0) !== input.expectedVersion ||
      current?.approvalHash !== previous?.approvalHash
    )
      throw conflict();
    await store.insert(agentTurns).values({
      id: randomUUID(),
      conversationId: input.conversationId,
      version: response.version,
      payload: {
        response,
        messages: [
          ...messages,
          { role: 'assistant', content: response.clarification || response.reply },
        ],
      },
      expiresAt: response.expiresAt,
    });
  });
  return response;
}

export async function approveChanges(db: Db, input: AgentApproveInput): Promise<AgentApplied> {
  const approvalHash = createHash('sha256')
    .update(JSON.stringify([...input.changes].sort((a, b) => a.id.localeCompare(b.id))))
    .digest('hex');
  return withWriteLock(db, async (store) => {
    const [turn] = await store
      .select()
      .from(agentTurns)
      .where(
        and(
          eq(agentTurns.conversationId, input.conversationId),
          eq(agentTurns.version, input.version),
        ),
      );
    if (!turn) throw conflict();
    if (turn.result) {
      if (turn.approvalHash !== approvalHash)
        throw conflict('이미 다른 선택으로 적용된 변경안이에요. 새 대화를 시작해 주세요.');
      return turn.result;
    }
    if (
      turn.expiresAt <= Date.now() ||
      (await latest(store, input.conversationId))?.version !== input.version
    )
      throw conflict();
    const before = await listCards(store);
    const currentProjects = await store.select().from(projects);
    const selected = input.changes.map((selection) => {
      const change = turn.payload.response.changes.find((item) => item.id === selection.id);
      if (!change) throw invalid('검토한 변경안에 없는 항목이에요.');
      const project = currentProjects.find((p) => p.id === change.after.projectId);
      if (
        !project ||
        project.name !== change.projectName ||
        project.updatedAt !== change.projectUpdatedAt
      )
        throw conflict('Project가 변경됐어요. 변경안을 다시 만들어 주세요.');
      const current = before.find((card) => card.id === change.cardId);
      if (change.before) {
        if (
          !current ||
          current.updatedAt !== change.before.updatedAt ||
          !same(content(current), content(change.before))
        )
          throw conflict();
      } else if (current) throw conflict();
      return { ...change, after: agentContent.parse({ ...change.after, title: selection.title }) };
    });
    const now = new Date().toISOString();
    let after = before;
    for (const change of selected) {
      if (!change.before)
        after = addCard(
          after,
          {
            id: change.cardId,
            title: change.after.title,
            status: change.after.status,
            projectId: change.after.projectId,
          },
          now,
        );
      else if (change.before.status !== change.after.status)
        after = moveCard(after, change.cardId, change.after.status, null, now);
      after = after.map((card) =>
        card.id === change.cardId ? { ...card, ...change.after, updatedAt: now } : card,
      );
    }
    const result: AgentApplied = {
      appliedCount: selected.length,
      cardIds: selected.map((item) => item.cardId),
      appliedAt: now,
    };
    const old = new Map(before.map((card) => [card.id, card]));
    const writes = after
      .filter((card) => !same(old.get(card.id), card))
      .map((card) =>
        old.has(card.id)
          ? store.update(cards).set(card).where(eq(cards.id, card.id))
          : store.insert(cards).values(card),
      );
    await runBatch(store, [
      ...writes,
      store.update(agentTurns).set({ approvalHash, result }).where(eq(agentTurns.id, turn.id)),
    ]);
    return result;
  });
}
