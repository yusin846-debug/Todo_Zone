import { describe, expect, it } from 'vitest';
import { setup } from './test-helpers.ts';

describe('Area API (D-083, D-084, D-086)', () => {
  it('Board에 기본 Area 4개가 만든 순서로 온다', async () => {
    const { board } = await setup();
    expect((await board()).areas.map((a) => [a.name, a.color])).toEqual([
      ['Business', 'gold'],
      ['Career', 'mist'],
      ['Ventures', 'salmon'],
      ['Life', 'sage'],
    ]);
  });

  it('만들 때 색이 없으면 4색을 순서대로, 이름은 1~20자이고 중복은 409', async () => {
    const { api } = await setup();
    const res = await api.post('/api/areas').send({ name: 'Family' }).expect(201);
    expect(res.body.color).toBe('mist'); // 5번째 → 순환
    await api.post('/api/areas').send({ name: ' career ' }).expect(409);
    await api
      .post('/api/areas')
      .send({ name: '가'.repeat(21) })
      .expect(400);
    await api.post('/api/areas').send({ name: 'X', color: 'inbox' }).expect(400);
  });

  it('8개까지 만들 수 있다', async () => {
    const { api } = await setup();
    for (const name of ['A', 'B', 'C', 'D'])
      await api.post('/api/areas').send({ name }).expect(201);
    const res = await api.post('/api/areas').send({ name: 'E' }).expect(409);
    expect(res.body.error.message).toBe('Area는 8개까지 만들 수 있어요.');
  });

  it('이름과 색을 바꾼다', async () => {
    const { api, areaId } = await setup();
    const id = await areaId('Life');
    const res = await api
      .patch(`/api/areas/${id}`)
      .send({ name: 'Life & Family', color: 'gold' })
      .expect(200);
    expect(res.body).toMatchObject({ name: 'Life & Family', color: 'gold' });
  });

  it('지우면 그 Project는 Area 없음이 되고 Card는 그대로다', async () => {
    const { api, areaId, addProject, addCard, board } = await setup();
    const career = await areaId('Career');
    const p = await addProject('커리어', { areaId: career });
    await addCard('면접 준비', 'todo', p.id);

    const res = await api.delete(`/api/areas/${career}`).expect(200);
    expect(res.body).toEqual({ unassignedProjects: 1 });
    const after = await board();
    expect(after.projects.find((x) => x.id === p.id)?.areaId).toBeNull();
    expect(after.cards).toHaveLength(1);
    await api.delete(`/api/areas/${career}`).expect(404);
  });
});
