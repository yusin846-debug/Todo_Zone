import { vi } from 'vitest';
import {
  addCard,
  moveCard,
  nextAreaColor,
  removeCard,
  type Area,
  type Card,
  type Project,
  type Status,
} from '@todo-zone/shared';

// 화면 테스트용 가짜 서버. 진짜 backend와 같은 shared 순서 규칙으로 동작한다.

const T = '2026-10-01T00:00:00.000Z';

export const areas: Area[] = [
  { id: 'a-career', name: 'Career', color: 'mist', createdAt: '2026-01-01', updatedAt: T },
  { id: 'a-ventures', name: 'Ventures', color: 'salmon', createdAt: '2026-01-02', updatedAt: T },
];

export const projects: Project[] = [
  {
    id: 'inbox',
    name: 'Inbox',
    areaId: null,
    icon: 'inbox',
    isInbox: true,
    createdAt: T,
    updatedAt: T,
  },
  {
    id: 'career',
    name: '커리어',
    areaId: 'a-career',
    icon: 'briefcase',
    isInbox: false,
    createdAt: T,
    updatedAt: T,
  },
  {
    id: 'chaeun',
    name: '채운',
    areaId: 'a-ventures',
    icon: 'sprout',
    isInbox: false,
    createdAt: T,
    updatedAt: T,
  },
];

export function card(
  id: string,
  status: Status,
  position: number,
  extra: Partial<Card> = {},
): Card {
  return {
    id,
    title: id,
    memo: '',
    checklist: [],
    dueDate: null,
    status,
    position,
    projectId: 'inbox',
    completedAt: status === 'done' ? new Date().toISOString() : null,
    createdAt: T,
    updatedAt: T,
    ...extra,
  };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const conflict = (message: string) => json({ error: { code: 'NAME_TAKEN', message } }, 409);

/** fetch를 가짜 서버로 바꾼다. down이면 모든 요청이 네트워크 오류로 실패한다. */
export function installFakeApi(initial: Card[], opts: { down?: boolean; auth?: boolean } = {}) {
  let authenticated = !opts.auth;
  let cards = [...initial];
  let projectList = [...projects];
  let areaList = [...areas];
  const calls: { method: string; path: string; body: unknown }[] = [];

  const fetchMock = vi.fn(async (path: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path, body });
    if (opts.down) throw new TypeError('Failed to fetch');
    const now = new Date().toISOString();

    if (method === 'GET' && path === '/api/auth/session')
      return json({ required: !!opts.auth, authenticated });
    if (method === 'POST' && path === '/api/auth/login') {
      if (body.password !== 'test-password')
        return json({ error: { code: 'UNAUTHORIZED', message: '로그인이 필요해요.' } }, 401);
      authenticated = true;
      return json({ authenticated });
    }
    if (method === 'POST' && path === '/api/auth/logout') {
      authenticated = false;
      return new Response(null, { status: 204 });
    }
    if (method === 'GET' && path === '/api/board')
      return json({ areas: areaList, projects: projectList, cards });

    // ---------- cards ----------
    if (method === 'POST' && path === '/api/cards') {
      cards = addCard(cards, body, now);
      return json(
        cards.find((c) => c.id === body.id),
        201,
      );
    }
    const move = path.match(/^\/api\/cards\/(.+)\/move$/);
    if (method === 'POST' && move) {
      cards = moveCard(cards, move[1]!, body.status, body.afterId, now);
      return json({ cards });
    }
    const oneCard = path.match(/^\/api\/cards\/([^/]+)$/);
    if (method === 'PATCH' && oneCard) {
      cards = cards.map((c) => (c.id === oneCard[1] ? { ...c, ...body } : c));
      return json(cards.find((c) => c.id === oneCard[1]));
    }
    if (method === 'DELETE' && oneCard) {
      cards = removeCard(cards, oneCard[1]!);
      return new Response(null, { status: 204 });
    }

    // ---------- projects ----------
    if (method === 'POST' && path === '/api/projects') {
      if (projectList.some((p) => p.name.toLowerCase() === body.name.trim().toLowerCase()))
        return conflict('이미 같은 이름의 Project가 있어요.');
      const created: Project = {
        id: `p${projectList.length}`,
        name: body.name.trim(),
        areaId: body.areaId ?? null,
        icon: body.icon ?? 'folder',
        isInbox: false,
        createdAt: now,
        updatedAt: now,
      };
      projectList = [...projectList, created];
      return json(created, 201);
    }
    const proj = path.match(/^\/api\/projects\/([^/]+)$/);
    if (method === 'PATCH' && proj) {
      projectList = projectList.map((p) => (p.id === proj[1] ? { ...p, ...body } : p));
      return json(projectList.find((p) => p.id === proj[1]));
    }
    if (method === 'DELETE' && proj) {
      const moved = cards.filter((c) => c.projectId === proj[1]).length;
      cards = cards.map((c) => (c.projectId === proj[1] ? { ...c, projectId: 'inbox' } : c));
      projectList = projectList.filter((p) => p.id !== proj[1]);
      return json({ movedCards: moved });
    }

    // ---------- areas ----------
    if (method === 'POST' && path === '/api/areas') {
      if (areaList.some((a) => a.name.toLowerCase() === body.name.trim().toLowerCase()))
        return conflict('이미 같은 이름의 Area가 있어요.');
      const created: Area = {
        id: `a${areaList.length}`,
        name: body.name.trim(),
        color: body.color ?? nextAreaColor(areaList.length),
        createdAt: now,
        updatedAt: now,
      };
      areaList = [...areaList, created];
      return json(created, 201);
    }
    const area = path.match(/^\/api\/areas\/([^/]+)$/);
    if (method === 'PATCH' && area) {
      areaList = areaList.map((a) => (a.id === area[1] ? { ...a, ...body } : a));
      return json(areaList.find((a) => a.id === area[1]));
    }
    if (method === 'DELETE' && area) {
      const n = projectList.filter((p) => p.areaId === area[1]).length;
      projectList = projectList.map((p) => (p.areaId === area[1] ? { ...p, areaId: null } : p));
      areaList = areaList.filter((a) => a.id !== area[1]);
      return json({ unassignedProjects: n });
    }

    return json({ error: { code: 'NOT_FOUND', message: '찾을 수 없어요.' } }, 404);
  });

  vi.stubGlobal('fetch', fetchMock);
  return { calls, cards: () => cards, projects: () => projectList, areas: () => areaList };
}
