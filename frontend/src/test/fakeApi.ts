import { vi } from 'vitest';
import {
  addCard,
  moveCard,
  nextProjectColor,
  removeCard,
  type Card,
  type Project,
  type Status,
} from '@todo-zone/shared';

// 화면 테스트용 가짜 서버. 진짜 backend와 같은 shared 순서 규칙으로 동작한다.

const T = '2026-10-01T00:00:00.000Z';

export const projects: Project[] = [
  {
    id: 'inbox',
    name: 'Inbox',
    color: 'inbox',
    icon: 'inbox',
    isInbox: true,
    createdAt: T,
    updatedAt: T,
  },
  {
    id: 'career',
    name: '커리어',
    color: 'gold',
    icon: 'briefcase',
    isInbox: false,
    createdAt: T,
    updatedAt: T,
  },
  {
    id: 'chaeun',
    name: '채운',
    color: 'salmon',
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

/** fetch를 가짜 서버로 바꾼다. down이면 모든 요청이 네트워크 오류로 실패한다. */
export function installFakeApi(initial: Card[], opts: { down?: boolean } = {}) {
  let cards = [...initial];
  let projectList = [...projects];
  const calls: { method: string; path: string; body: unknown }[] = [];

  const fetchMock = vi.fn(async (path: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path, body });
    if (opts.down) throw new TypeError('Failed to fetch');

    if (method === 'GET' && path === '/api/board') return json({ projects: projectList, cards });
    if (method === 'POST' && path === '/api/cards') {
      cards = addCard(cards, body, new Date().toISOString());
      return json(
        cards.find((c) => c.id === body.id),
        201,
      );
    }
    const move = path.match(/^\/api\/cards\/(.+)\/move$/);
    if (method === 'POST' && move) {
      cards = moveCard(cards, move[1]!, body.status, body.afterId, new Date().toISOString());
      return json({ cards });
    }
    const one = path.match(/^\/api\/cards\/([^/]+)$/);
    if (method === 'PATCH' && one) {
      cards = cards.map((c) => (c.id === one[1] ? { ...c, ...body } : c));
      return json(cards.find((c) => c.id === one[1]));
    }
    if (method === 'DELETE' && one) {
      cards = removeCard(cards, one[1]!);
      return new Response(null, { status: 204 });
    }

    if (method === 'POST' && path === '/api/projects') {
      const taken = projectList.some(
        (p) => p.name.toLowerCase() === body.name.trim().toLowerCase(),
      );
      if (taken)
        return json(
          { error: { code: 'NAME_TAKEN', message: '이미 같은 이름의 Project가 있어요.' } },
          409,
        );
      const created: Project = {
        id: `p${projectList.length}`,
        name: body.name.trim(),
        color: body.color ?? nextProjectColor(projectList.length - 1),
        icon: body.icon ?? 'folder',
        isInbox: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

    return json({ error: { code: 'NOT_FOUND', message: '찾을 수 없어요.' } }, 404);
  });

  vi.stubGlobal('fetch', fetchMock);
  return { calls, cards: () => cards, projects: () => projectList };
}
