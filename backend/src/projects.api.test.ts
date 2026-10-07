import { describe, expect, it } from 'vitest';
import { setup } from './test-helpers.ts';

describe('POST /api/projects (F8)', () => {
  it('색은 4색을 순서대로, 아이콘은 folder가 기본값이다 (D-042, D-062)', async () => {
    const { api } = await setup();
    const colors = [];
    for (const name of ['A', 'B', 'C', 'D', 'E']) {
      const res = await api.post('/api/projects').send({ name }).expect(201);
      colors.push(res.body.color);
      expect(res.body.icon).toBe('folder');
      expect(res.body.isInbox).toBe(false);
    }
    expect(colors).toEqual(['mist', 'gold', 'sage', 'salmon', 'mist']);
  });

  it('고른 색과 아이콘을 쓰고, inbox 색·아이콘은 고를 수 없다', async () => {
    const { api } = await setup();
    const res = await api
      .post('/api/projects')
      .send({ name: '학교', color: 'sage', icon: 'graduation-cap' })
      .expect(201);
    expect(res.body).toMatchObject({ name: '학교', color: 'sage', icon: 'graduation-cap' });
    await api.post('/api/projects').send({ name: 'x', color: 'inbox' }).expect(400);
    await api.post('/api/projects').send({ name: 'y', icon: 'inbox' }).expect(400);
    await api.post('/api/projects').send({ name: 'z', icon: 'rocket' }).expect(400);
  });

  it('이름은 공백 제거 후 1~30자 (D-065)', async () => {
    const { api } = await setup();
    await api
      .post('/api/projects')
      .send({ name: '가'.repeat(30) })
      .expect(201);
    const long = await api
      .post('/api/projects')
      .send({ name: '나'.repeat(31) })
      .expect(400);
    expect(long.body.error.message).toBe('Project 이름은 30자까지 쓸 수 있어요.');
    await api.post('/api/projects').send({ name: '   ' }).expect(400);
  });

  it('이름 중복은 공백·영문 대소문자를 무시하고 409 NAME_TAKEN (D-053)', async () => {
    const { api, addProject } = await setup();
    await addProject('Work');
    for (const name of ['work', '  WORK ', 'Inbox', 'inbox']) {
      const res = await api.post('/api/projects').send({ name }).expect(409);
      expect(res.body.error).toEqual({
        code: 'NAME_TAKEN',
        message: '이미 같은 이름의 Project가 있어요.',
      });
    }
  });

  it('Inbox 포함 20개까지, 21번째는 409 PROJECT_LIMIT (D-034)', async () => {
    const { api, addProject } = await setup();
    for (let i = 1; i <= 19; i++) await addProject(`P${i}`);
    const res = await api.post('/api/projects').send({ name: 'P20' }).expect(409);
    expect(res.body.error).toEqual({
      code: 'PROJECT_LIMIT',
      message: 'Project는 20개까지 만들 수 있어요.',
    });
  });
});

describe('PATCH /api/projects/:id (F8)', () => {
  it('이름·색·아이콘을 바꾸고, 자기 이름의 대소문자만 바꾸는 것은 된다', async () => {
    const { api, addProject } = await setup();
    const p = await addProject('work');
    const res = await api
      .patch(`/api/projects/${p.id}`)
      .send({ name: 'Work', color: 'gold', icon: 'briefcase' })
      .expect(200);
    expect(res.body).toMatchObject({ name: 'Work', color: 'gold', icon: 'briefcase' });
  });

  it('다른 Project 이름으로는 못 바꾼다', async () => {
    const { api, addProject } = await setup();
    await addProject('학교');
    const p = await addProject('개인');
    await api.patch(`/api/projects/${p.id}`).send({ name: '학교' }).expect(409);
  });

  it('Inbox는 바꿀 수 없다 (400 INBOX_LOCKED)', async () => {
    const { api, inboxId } = await setup();
    const res = await api
      .patch(`/api/projects/${await inboxId()}`)
      .send({ name: '받은함' })
      .expect(400);
    expect(res.body.error).toEqual({
      code: 'INBOX_LOCKED',
      message: 'Inbox는 바꾸거나 삭제할 수 없어요.',
    });
  });

  it('없는 Project는 404', async () => {
    const { api } = await setup();
    await api.patch('/api/projects/nope').send({ name: 'x' }).expect(404);
  });
});

describe('DELETE /api/projects/:id (F8)', () => {
  it('Card는 순서를 유지한 채 Inbox로 옮겨지고 Project는 사라진다', async () => {
    const { api, addProject, addCard, board, inboxId } = await setup();
    const school = await addProject('학교');
    await addCard('S2', 'todo', school.id);
    await addCard('I1', 'todo');
    await addCard('S1', 'todo', school.id);

    const res = await api.delete(`/api/projects/${school.id}`).expect(200);
    expect(res.body).toEqual({ movedCards: 2 });

    const after = await board();
    const inbox = await inboxId();
    expect(after.projects.map((p) => p.name)).toEqual(['Inbox']);
    expect(after.cards.map((c) => [c.title, c.position])).toEqual([
      ['S1', 0],
      ['I1', 1],
      ['S2', 2],
    ]);
    expect(after.cards.every((c) => c.projectId === inbox)).toBe(true);
  });

  it('Inbox는 지울 수 없고, 없는 Project는 404', async () => {
    const { api, inboxId } = await setup();
    await api.delete(`/api/projects/${await inboxId()}`).expect(400);
    await api.delete('/api/projects/nope').expect(404);
  });
});

describe('GET /api/board 정렬', () => {
  it('Project는 Inbox가 먼저, 나머지는 만든 순서', async () => {
    const { addProject, board } = await setup();
    await addProject('B');
    await addProject('A');
    expect((await board()).projects.map((p) => p.name)).toEqual(['Inbox', 'B', 'A']);
  });
});
