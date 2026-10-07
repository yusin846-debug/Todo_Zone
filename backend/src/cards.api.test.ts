import { describe, expect, it } from 'vitest';
import { setup } from './test-helpers.ts';

describe('GET /api/board', () => {
  it('처음에는 Inbox 하나와 빈 Card 목록이 있다 (DATA-MODEL 6)', async () => {
    const { board } = await setup();
    const { projects, cards } = await board();
    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject({
      name: 'Inbox',
      isInbox: true,
      icon: 'inbox',
      areaId: null,
    });
    expect(cards).toEqual([]);
  });
});

describe('POST /api/cards (F2)', () => {
  it('새 Card는 그 열 맨 위에 생기고, projectId가 없으면 Inbox에 들어간다', async () => {
    const { api, titles, inboxId } = await setup();
    await api.post('/api/cards').send({ title: '첫째', status: 'todo' }).expect(201);
    const res = await api
      .post('/api/cards')
      .send({ title: '  둘째  ', status: 'todo' })
      .expect(201);

    expect(res.body).toMatchObject({ title: '둘째', memo: '', dueDate: null, position: 0 });
    expect(res.body.projectId).toBe(await inboxId());
    expect(await titles('todo')).toEqual(['둘째', '첫째']);
  });

  it('frontend가 보낸 UUID를 그대로 쓴다 (D-050)', async () => {
    const { api } = await setup();
    const id = crypto.randomUUID();
    const res = await api.post('/api/cards').send({ id, title: 'x', status: 'doing' }).expect(201);
    expect(res.body.id).toBe(id);
    await api.post('/api/cards').send({ id, title: 'y', status: 'doing' }).expect(400);
  });

  it('빈 제목·공백 제목은 400 VALIDATION', async () => {
    const { api } = await setup();
    const res = await api.post('/api/cards').send({ title: '   ', status: 'todo' }).expect(400);
    expect(res.body).toEqual({ error: { code: 'VALIDATION', message: '제목을 입력해 주세요.' } });
  });

  it('제목 100자는 되고 101자는 안 된다. 이모지도 1자로 센다 (DATA-MODEL 3)', async () => {
    const { api } = await setup();
    await api
      .post('/api/cards')
      .send({ title: '😀'.repeat(100), status: 'todo' })
      .expect(201);
    const res = await api.post('/api/cards').send({ title: '가'.repeat(101), status: 'todo' });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('제목은 100자까지 쓸 수 있어요.');
  });

  it('없는 Project, 잘못된 status, 모르는 필드는 거부한다', async () => {
    const { api } = await setup();
    await api
      .post('/api/cards')
      .send({ title: 'x', status: 'todo', projectId: 'nope' })
      .expect(404);
    await api.post('/api/cards').send({ title: 'x', status: 'later' }).expect(400);
    await api.post('/api/cards').send({ title: 'x', status: 'todo', position: 3 }).expect(400);
  });

  it('깨진 JSON은 400', async () => {
    const { api } = await setup();
    const res = await api
      .post('/api/cards')
      .set('Content-Type', 'application/json')
      .send('{"title":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION');
  });
});

describe('PATCH /api/cards/:id (F3)', () => {
  it('제목·메모·Due date·Project를 바꾸고, null로 Due date를 지운다', async () => {
    const { api, addCard, addProject } = await setup();
    const card = await addCard('원래 제목');
    const school = await addProject('학교');

    const res = await api
      .patch(`/api/cards/${card.id}`)
      .send({ title: '새 제목', memo: '메모', dueDate: '2026-10-09', projectId: school.id })
      .expect(200);
    expect(res.body).toMatchObject({
      title: '새 제목',
      memo: '메모',
      dueDate: '2026-10-09',
      projectId: school.id,
    });

    const cleared = await api.patch(`/api/cards/${card.id}`).send({ dueDate: null }).expect(200);
    expect(cleared.body.dueDate).toBeNull();
  });

  it('메모 2,000자까지, 없는 날짜·빈 요청·status 변경은 거부', async () => {
    const { api, addCard } = await setup();
    const { id } = await addCard('x');
    await api
      .patch(`/api/cards/${id}`)
      .send({ memo: '가'.repeat(2000) })
      .expect(200);
    await api
      .patch(`/api/cards/${id}`)
      .send({ memo: '가'.repeat(2001) })
      .expect(400);
    await api.patch(`/api/cards/${id}`).send({ dueDate: '2026-02-30' }).expect(400);
    await api.patch(`/api/cards/${id}`).send({}).expect(400);
    await api.patch(`/api/cards/${id}`).send({ status: 'done' }).expect(400);
  });

  it('없는 Card는 404', async () => {
    const { api } = await setup();
    const res = await api.patch('/api/cards/nope').send({ title: 'x' }).expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('POST /api/cards/:id/move (F4, F5, DATA-MODEL 4)', () => {
  async function threeTodos() {
    const ctx = await setup();
    const c = await ctx.addCard('C');
    const b = await ctx.addCard('B');
    const a = await ctx.addCard('A'); // todo = [A, B, C]
    return { ...ctx, a, b, c };
  }

  async function positionsAreDense(
    board: Awaited<ReturnType<Awaited<ReturnType<typeof setup>>['board']>>,
  ) {
    return ['todo', 'doing', 'done'].every((s) =>
      board.cards
        .filter((c) => c.status === s)
        .sort((x, y) => x.position - y.position)
        .every((c, i) => c.position === i),
    );
  }

  it('같은 열 안에서 뒤로 옮긴다', async () => {
    const { api, a, c, titles, board } = await threeTodos();
    await api.post(`/api/cards/${a.id}/move`).send({ status: 'todo', afterId: c.id }).expect(200);
    expect(await titles('todo')).toEqual(['B', 'C', 'A']);
    expect(await positionsAreDense(await board())).toBe(true);
  });

  it('다른 열로 옮기면 양쪽 순번이 빈틈없고, 영향받은 열의 Card를 돌려준다', async () => {
    const { api, b, titles, board } = await threeTodos();
    const res = await api
      .post(`/api/cards/${b.id}/move`)
      .send({ status: 'done', afterId: null })
      .expect(200);

    expect(await titles('todo')).toEqual(['A', 'C']);
    expect(await titles('done')).toEqual(['B']);
    expect(res.body.cards.map((c: { title: string }) => c.title).sort()).toEqual(['A', 'B', 'C']);
    expect(await positionsAreDense(await board())).toBe(true);
  });

  it('afterId가 그 열에 없으면 404, 자기 자신이면 400', async () => {
    const { api, a, b } = await threeTodos();
    await api.post(`/api/cards/${a.id}/move`).send({ status: 'doing', afterId: b.id }).expect(404);
    await api.post(`/api/cards/${a.id}/move`).send({ status: 'todo', afterId: a.id }).expect(400);
  });

  it('필터 중에는 보이는 Card 바로 뒤에, status 전체 순서 기준으로 끼운다', async () => {
    const { api, addCard, addProject, titles } = await setup();
    const school = await addProject('학교');
    await addCard('S2', 'todo', school.id);
    await addCard('I1', 'todo');
    await addCard('S1', 'todo', school.id); // todo = [S1, I1, S2], 학교 필터로는 [S1, S2]
    const moving = await addCard('X', 'doing', school.id);
    expect(await titles('todo')).toEqual(['S1', 'I1', 'S2']);

    const { body } = await api.get('/api/board');
    const s1Id = body.cards.find((c: { title: string }) => c.title === 'S1').id;
    await api
      .post(`/api/cards/${moving.id}/move`)
      .send({ status: 'todo', afterId: s1Id })
      .expect(200);
    expect(await titles('todo')).toEqual(['S1', 'X', 'I1', 'S2']);
  });
});

describe('완료 시각 completedAt (D-072)', () => {
  it('Done으로 옮기면 기록되고, 다시 Todo로 열면 지워진다', async () => {
    const { api, addCard } = await setup();
    const { id } = await addCard('끝낼 일');

    const done = await api
      .post(`/api/cards/${id}/move`)
      .send({ status: 'done', afterId: null })
      .expect(200);
    const doneCard = done.body.cards.find((c: { id: string }) => c.id === id);
    expect(Date.parse(doneCard.completedAt)).not.toBeNaN();

    const reopened = await api
      .post(`/api/cards/${id}/move`)
      .send({ status: 'todo', afterId: null })
      .expect(200);
    expect(reopened.body.cards.find((c: { id: string }) => c.id === id).completedAt).toBeNull();
  });

  it('Done 안에서 순서만 바꾸면 그대로, Done으로 바로 만들면 기록된다', async () => {
    const { api, addCard } = await setup();
    const a = await addCard('A', 'done');
    const b = await addCard('B', 'done');
    const before = (a as unknown as { completedAt: string }).completedAt;
    expect(before).not.toBeNull();

    const res = await api
      .post(`/api/cards/${a.id}/move`)
      .send({ status: 'done', afterId: b.id })
      .expect(200);
    expect(res.body.cards.find((c: { id: string }) => c.id === a.id).completedAt).toBe(before);
  });

  it('새 Todo Card는 completedAt이 null이다', async () => {
    const { addCard } = await setup();
    const card = (await addCard('x')) as unknown as { completedAt: string | null };
    expect(card.completedAt).toBeNull();
  });
});

describe('동시 요청 (services/lock.ts)', () => {
  it('이동 요청 20개를 한꺼번에 보내도 Card 수와 빈틈없는 순번이 유지된다', async () => {
    const { api, addCard, board } = await setup();
    const ids: string[] = [];
    for (let i = 0; i < 6; i++) ids.push((await addCard(`C${i}`)).id);

    const statuses = ['todo', 'doing', 'done'] as const;
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        api
          .post(`/api/cards/${ids[i % ids.length]}/move`)
          .send({ status: statuses[i % 3], afterId: null }),
      ),
    );

    const { cards } = await board();
    expect(cards).toHaveLength(6);
    for (const s of statuses) {
      const positions = cards.filter((c) => c.status === s).map((c) => c.position);
      expect(positions).toEqual(positions.map((_, i) => i));
    }
  });
});

describe('DELETE /api/cards/:id (F7)', () => {
  it('지우면 뒤의 Card가 당겨지고, 다시 지우면 404', async () => {
    const { api, addCard, board } = await setup();
    await addCard('C');
    const b = await addCard('B');
    await addCard('A');

    await api.delete(`/api/cards/${b.id}`).expect(204);
    const todo = (await board()).cards.filter((c) => c.status === 'todo');
    expect(todo.map((c) => [c.title, c.position])).toEqual([
      ['A', 0],
      ['C', 1],
    ]);
    await api.delete(`/api/cards/${b.id}`).expect(404);
  });
});
