import { vi } from 'vitest';
import { addCard, moveCard, type Card, type Project, type Status } from '@todo-zone/shared';

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
  const calls: { method: string; path: string; body: unknown }[] = [];

  const fetchMock = vi.fn(async (path: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path, body });
    if (opts.down) throw new TypeError('Failed to fetch');

    if (method === 'GET' && path === '/api/board') return json({ projects, cards });
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
    return json({ error: { code: 'NOT_FOUND', message: '찾을 수 없어요.' } }, 404);
  });

  vi.stubGlobal('fetch', fetchMock);
  return { calls, cards: () => cards };
}
