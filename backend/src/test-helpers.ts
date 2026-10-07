import request from 'supertest';
import { createApp } from './app.ts';
import { openDb } from './db/client.ts';

/** 테스트마다 새 메모리 DB와 앱을 만든다. */
export async function setup() {
  const db = await openDb(':memory:');
  const app = createApp(db);
  const api = request(app);

  const board = async () =>
    (await api.get('/api/board').expect(200)).body as {
      areas: { id: string; name: string; color: string }[];
      projects: {
        id: string;
        name: string;
        isInbox: boolean;
        icon: string;
        areaId: string | null;
      }[];
      cards: { id: string; title: string; status: string; position: number; projectId: string }[];
    };
  const areaId = async (name: string) => (await board()).areas.find((a) => a.name === name)!.id;
  const inboxId = async () => (await board()).projects.find((p) => p.isInbox)!.id;
  const titles = async (status: string) =>
    (await board()).cards.filter((c) => c.status === status).map((c) => c.title);
  const addCard = async (title: string, status = 'todo', projectId?: string) =>
    (await api.post('/api/cards').send({ title, status, projectId }).expect(201)).body as {
      id: string;
    };
  const addProject = async (name: string, extra: object = {}) =>
    (
      await api
        .post('/api/projects')
        .send({ name, ...extra })
        .expect(201)
    ).body as { id: string };

  return { db, api, board, areaId, inboxId, titles, addCard, addProject };
}
