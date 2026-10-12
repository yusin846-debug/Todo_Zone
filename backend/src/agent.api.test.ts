import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { createApp } from './app.ts';
import { openDb, type Db } from './db/client.ts';
import { agentTurns, agentLimits } from './db/schema.ts';
import { ensureAgentTables } from './agent/service.ts';
import { agentFailure, type ModelPlan, type AgentPlanner } from './agent/model.ts';
import type { AgentReply } from '@todo-zone/shared';

const databases: Db[] = [];
afterEach(() => {
  databases.splice(0).forEach((db) => db.$client.close());
});
const proposal = (
  patch: Partial<ModelPlan['changes'][number]> = {},
): ModelPlan['changes'][number] => ({
  cardId: null,
  fields: ['title'],
  title: '새 Card',
  memo: null,
  dueDate: null,
  projectId: null,
  status: null,
  checklist: null,
  ...patch,
});
async function setup(plan: ModelPlan | AgentPlanner) {
  const db = await openDb(':memory:');
  databases.push(db);
  const planner = vi.fn(typeof plan === 'function' ? plan : async () => plan);
  const api = request(createApp(db, undefined, planner));
  const conversationId = crypto.randomUUID();
  const chat = async (expectedVersion = 0, extra = {}) =>
    (
      await api
        .post('/api/agent/chat')
        .send({
          conversationId,
          expectedVersion,
          message: 'Card 정리해줘',
          timezone: 'Asia/Seoul',
          ...extra,
        })
        .expect(200)
    ).body as AgentReply;
  const approve = (
    draft: AgentReply,
    selections = draft.changes.map((item) => ({ id: item.id, title: item.after.title })),
  ) =>
    api
      .post('/api/agent/approve')
      .send({ conversationId, version: draft.version, changes: selections });
  const board = async () => (await api.get('/api/board').expect(200)).body;
  return { db, api, planner, conversationId, chat, approve, board };
}

describe('Agent approval boundary', () => {
  it('proposes without writing, supports exclusions/title edits, and applies concurrent retries once', async () => {
    const t = await setup({
      reply: '변경안을 만들었어요.',
      clarification: null,
      changes: [proposal(), proposal({ title: '제외할 Card' })],
    });
    const draft = await t.chat();
    expect((await t.board()).cards).toHaveLength(0);
    const selections = [{ id: draft.changes[0]!.id, title: '수정한 제목' }];
    const results = await Promise.all([t.approve(draft, selections), t.approve(draft, selections)]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect(results[0]!.body).toEqual(results[1]!.body);
    expect(
      (await t.board()).cards.map((card: { title: string; status: string }) => [
        card.title,
        card.status,
      ]),
    ).toEqual([['수정한 제목', 'todo']]);
    await t.approve(draft).expect(409);
  });

  it('updates content and completion together, keeping unrelated fields and continuous ordering', async () => {
    const t = await setup(async ({ board }) => ({
      reply: '완료 변경안이에요.',
      clarification: null,
      changes: [
        proposal({
          cardId: board.cards[0]!.id,
          title: null,
          fields: ['status', 'memo', 'dueDate'],
          status: 'done',
          memo: '새 메모',
          dueDate: '2026-10-13',
        }),
        proposal({
          title: '새 Card',
          fields: ['title', 'checklist'],
          checklist: [{ id: null, text: '준비', checked: false }],
        }),
      ],
    }));
    await t.api.post('/api/cards').send({ title: '기존 Card', status: 'todo' }).expect(201);
    await t.api.post('/api/cards').send({ title: '다른 Card', status: 'todo' }).expect(201);
    const draft = await t.chat();
    const targetId = draft.changes[0]!.cardId;
    expect((await t.board()).cards.find((c: { id: string }) => c.id === targetId).status).toBe(
      'todo',
    );
    await t.approve(draft).expect(200);
    const saved = (await t.board()).cards;
    expect(saved.find((c: { id: string }) => c.id === targetId)).toMatchObject({
      status: 'done',
      memo: '새 메모',
      dueDate: '2026-10-13',
      completedAt: expect.any(String),
    });
    expect(
      saved
        .filter((c: { status: string }) => c.status === 'todo')
        .map((c: { position: number }) => c.position),
    ).toEqual([0, 1]);
    expect(saved.find((c: { title: string }) => c.title === '새 Card').checklist[0].id).toMatch(
      /^[0-9a-f-]{36}$/,
    );
  });

  it('rejects the whole bundle if a reviewed Card has changed, without creating another Card', async () => {
    const t = await setup(async ({ board }) => ({
      reply: '변경안',
      clarification: null,
      changes: [proposal(), proposal({ cardId: board.cards[0]!.id, title: '변경 제목' })],
    }));
    const old = (
      await t.api.post('/api/cards').send({ title: '원래 제목', status: 'todo' }).expect(201)
    ).body;
    const draft = await t.chat();
    await t.api.patch(`/api/cards/${old.id}`).send({ memo: '다른 창에서 수정' }).expect(200);
    await t.approve(draft).expect(409);
    expect((await t.board()).cards).toHaveLength(1);
    expect((await t.board()).cards[0]).toMatchObject({
      title: '원래 제목',
      memo: '다른 창에서 수정',
    });
  });

  it('rejects expired, superseded, forged and empty approvals', async () => {
    const t = await setup({ reply: '변경안', clarification: null, changes: [proposal()] });
    const first = await t.chat();
    const next = await t.chat(1);
    await t.approve(first).expect(409);
    await t.approve(next, [{ id: crypto.randomUUID(), title: '위조' }]).expect(400);
    await t.approve(next, []).expect(400);
    await t.db.update(agentTurns).set({ expiresAt: 1 }).where(eq(agentTurns.version, 2));
    await t.approve(next).expect(409);
    expect((await t.board()).cards).toHaveLength(0);
  });

  it('asks for clarification without providing approval changes and uses server context', async () => {
    const t = await setup({
      reply: '어떤 Card인가요?',
      clarification: '같은 제목 중 어느 Project인가요?',
      changes: [],
    });
    const draft = await t.chat();
    expect(draft.changes).toEqual([]);
    expect(t.planner.mock.calls[0]![0]).toMatchObject({
      timezone: 'Asia/Seoul',
      today: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      pending: [],
    });
    await t.approve(draft).expect(400);
  });

  it('passes selected edited drafts into follow-up dialogue and only accepts a single concurrent revision', async () => {
    const t = await setup({ reply: '변경안', clarification: null, changes: [proposal()] });
    const first = await t.chat();
    const args = {
      conversationId: t.conversationId,
      expectedVersion: 1,
      message: '이 제목으로 내일까지',
      timezone: 'Asia/Seoul',
      draft: [{ id: first.changes[0]!.id, title: '검토 중 수정', selected: true }],
    };
    const replies = await Promise.all([
      t.api.post('/api/agent/chat').send(args),
      t.api.post('/api/agent/chat').send(args),
    ]);
    expect(replies.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(t.planner.mock.calls[1]![0].pending[0]!.after.title).toBe('검토 중 수정');
  });

  it('rejects invalid model targets and invalid dates without Card writes', async () => {
    const t = await setup({
      reply: '변경안',
      clarification: null,
      changes: [proposal({ cardId: 'invented' })],
    });
    const args = {
      conversationId: t.conversationId,
      expectedVersion: 0,
      message: '수정',
      timezone: 'Asia/Seoul',
    };
    await t.api.post('/api/agent/chat').send(args).expect(400);
    t.planner.mockResolvedValue({
      reply: '변경안',
      clarification: null,
      changes: [proposal({ fields: ['title', 'dueDate'], dueDate: '2026-02-30' })],
    });
    await t.api.post('/api/agent/chat').send(args).expect(400);
    expect((await t.board()).cards).toHaveLength(0);
  });

  it('rolls back all Card writes and the approval receipt if a write fails midway', async () => {
    const t = await setup({
      reply: '변경안',
      clarification: null,
      changes: [proposal(), proposal({ title: '저장 실패' })],
    });
    const draft = await t.chat();
    await t.db.$client.execute(
      "CREATE TRIGGER fail_agent_test BEFORE INSERT ON cards WHEN NEW.title = '저장 실패' BEGIN SELECT RAISE(ABORT, 'test'); END",
    );
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await t.approve(draft).expect(500);
    } finally {
      spy.mockRestore();
    }
    expect((await t.board()).cards).toHaveLength(0);
    expect((await t.db.select().from(agentTurns))[0]!.result).toBeNull();
  });

  it('enforces a durable request limit before calling the model', async () => {
    const t = await setup({ reply: '안내', clarification: null, changes: [] });
    await ensureAgentTables(t.db);
    await t.db.insert(agentLimits).values({ id: 'hour', count: 60, resetAt: Date.now() + 100000 });
    await t.api
      .post('/api/agent/chat')
      .send({
        conversationId: t.conversationId,
        expectedVersion: 0,
        message: '정리',
        timezone: 'Asia/Seoul',
      })
      .expect(429);
    expect(t.planner).not.toHaveBeenCalled();
  });

  it('requires the existing owner authentication for both inference and approval', async () => {
    const db = await openDb(':memory:');
    databases.push(db);
    const api = request(
      createApp(db, {
        passwordHash: `scrypt:${'a'.repeat(32)}:${'b'.repeat(128)}`,
        sessionSecret: 's'.repeat(48),
        secure: false,
      }),
    );
    await api.get('/api/agent/status').expect(401);
    await api.post('/api/agent/chat').send({}).expect(401);
    await api.post('/api/agent/approve').send({}).expect(401);
  });
});

describe('AI Gateway actionable failures', () => {
  it('distinguishes account verification, credits, and policy denial without leaking raw errors', () => {
    const verification = agentFailure(
      Object.assign(new Error('customer_verification_required: valid payment method required'), {
        statusCode: 403,
      }),
    );
    expect(verification.message).toContain('결제수단 등록');
    const credits = agentFailure(
      Object.assign(new Error('insufficient_funds'), { statusCode: 402 }),
    );
    expect(credits.message).toContain('크레딧 잔액');
    const policy = agentFailure(
      Object.assign(new Error('blocked by rule with private payload'), { statusCode: 403 }),
    );
    expect(policy.code).toBe('AGENT_UNAVAILABLE');
    expect(policy.message).not.toContain('private payload');
    expect(policy.message).not.toContain('잔액');
  });
});
