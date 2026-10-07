import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addCard,
  moveCard,
  removeCard,
  type Area,
  type Card,
  type CreateAreaInput,
  type CreateProjectInput,
  type Project,
  type Status,
  type UpdateAreaInput,
  type UpdateCardInput,
  type UpdateProjectInput,
} from '@todo-zone/shared';
import { request } from './client.ts';

// Board 데이터의 서버 연결 (step11-4, D-038).
// 화면은 캐시를 먼저 바꾸고(낙관적 업데이트), 서버가 실패하면 되돌린다.

export type BoardData = { areas: Area[]; projects: Project[]; cards: Card[] };

const BOARD_KEY = ['board'] as const;
// 같은 scope의 mutation은 하나씩 순서대로 보내진다: 요청 순서가 뒤바뀌지 않게 한다.
const SCOPE = { id: 'board' };

export function useBoardQuery() {
  return useQuery({
    queryKey: BOARD_KEY,
    queryFn: () => request<BoardData>('GET', '/api/board'),
  });
}

export function useBoardActions(onError: (message: string) => void) {
  const qc = useQueryClient();
  const snapshot = useRef<BoardData | undefined>(undefined);

  const read = () => qc.getQueryData<BoardData>(BOARD_KEY);
  const write = (data: BoardData | undefined) => qc.setQueryData(BOARD_KEY, data);
  const setCards = (fn: (cards: Card[]) => Card[]) =>
    qc.setQueryData<BoardData>(BOARD_KEY, (b) => (b ? { ...b, cards: fn(b.cards) } : b));
  const mergeCards = (fresh: Card[]) => {
    const byId = new Map(fresh.map((c) => [c.id, c]));
    setCards((cards) => cards.map((c) => byId.get(c.id) ?? c));
  };

  const create = useMutation({
    scope: SCOPE,
    mutationFn: (input: { id: string; title: string; status: Status; projectId: string }) =>
      request<Card>('POST', '/api/cards', input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: BOARD_KEY });
      const prev = read();
      setCards((cards) => addCard(cards, input, new Date().toISOString()));
      return { prev };
    },
    onSuccess: (card) => mergeCards([card]),
    onError: (err, _input, ctx) => {
      write(ctx?.prev);
      onError(err.message);
    },
  });

  const move = useMutation({
    scope: SCOPE,
    mutationFn: (v: { id: string; status: Status; afterId: string | null; prev: BoardData }) =>
      request<{ cards: Card[] }>('POST', `/api/cards/${v.id}/move`, {
        status: v.status,
        afterId: v.afterId,
      }),
    onSuccess: ({ cards }) => mergeCards(cards),
    onError: (err, v) => {
      write(v.prev);
      onError(err.message);
    },
  });

  // 상세 패널의 Save (F3, F4 모바일): 내용 수정 후, Status가 바뀌었으면 새 열 맨 위로 옮긴다.
  const save = useMutation({
    scope: SCOPE,
    mutationFn: async (v: {
      id: string;
      patch: UpdateCardInput;
      status: Status | null;
      prev: BoardData;
    }) => {
      const fresh: Card[] = [];
      if (Object.keys(v.patch).length > 0)
        fresh.push(await request<Card>('PATCH', `/api/cards/${v.id}`, v.patch));
      if (v.status !== null)
        fresh.push(
          ...(
            await request<{ cards: Card[] }>('POST', `/api/cards/${v.id}/move`, {
              status: v.status,
              afterId: null,
            })
          ).cards,
        );
      return fresh;
    },
    onSuccess: (fresh) => mergeCards(fresh),
    onError: (err, v) => {
      write(v.prev);
      onError(err.message);
    },
  });

  // Card 삭제 (F7). 확인은 화면이 먼저 받는다.
  const remove = useMutation({
    scope: SCOPE,
    mutationFn: (v: { id: string; prev: BoardData }) =>
      request<void>('DELETE', `/api/cards/${v.id}`),
    onError: (err, v) => {
      write(v.prev);
      onError(err.message);
    },
  });

  return {
    /** patch는 바뀐 필드만, status는 바뀐 경우에만 넘긴다. */
    saveCard: (id: string, patch: UpdateCardInput, status: Status | null) => {
      const prev = read();
      if (!prev) return;
      const nowIso = new Date().toISOString();
      setCards((cards) => {
        const patched = cards.map((c) => (c.id === id ? { ...c, ...patch } : c));
        return status === null ? patched : moveCard(patched, id, status, null, nowIso);
      });
      save.mutate({ id, patch, status, prev });
    },
    deleteCard: (id: string) => {
      const prev = read();
      if (!prev) return;
      setCards((cards) => removeCard(cards, id));
      remove.mutate({ id, prev });
    },

    createCard: (title: string, status: Status, projectId: string) =>
      create.mutate({ id: crypto.randomUUID(), title, status, projectId }),

    /** 드래그 시작: 되돌릴 수 있게 현재 상태를 기억한다. */
    startDrag: () => {
      snapshot.current = read();
    },
    /** 드래그 중: 캐시만 바꿔서 미리 보여 준다. 서버에는 보내지 않는다. */
    previewMove: (cardId: string, toStatus: Status, afterId: string | null) =>
      setCards((cards) => moveCard(cards, cardId, toStatus, afterId, new Date().toISOString())),
    /** 놓았을 때: 최종 위치를 한 번만 서버에 보낸다. */
    commitMove: (cardId: string) => {
      const prev = snapshot.current;
      snapshot.current = undefined;
      const now = read();
      const before = prev?.cards.find((c) => c.id === cardId);
      const after = now?.cards.find((c) => c.id === cardId);
      if (!prev || !now || !before || !after) return;
      if (before.status === after.status && before.position === after.position) return;

      // 서버 규칙(DATA-MODEL 4)대로 "status 전체 순서에서 바로 앞 Card"를 afterId로 보낸다.
      const afterId =
        now.cards.find((c) => c.status === after.status && c.position === after.position - 1)?.id ??
        null;
      move.mutate({ id: cardId, status: after.status, afterId, prev });
    },
    cancelDrag: () => {
      if (snapshot.current) write(snapshot.current);
      snapshot.current = undefined;
    },
  };
}

/**
 * Project 관리 (F8). 규칙 검사(이름 중복, 20개, Inbox)는 서버가 하므로 낙관적으로 바꾸지 않고
 * 응답을 기다린다. 실패하면 ApiRequestError를 던져서 화면이 한글 문구를 그 자리에 보여 준다.
 */
export function useProjectActions() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: BOARD_KEY });

  return {
    createProject: async (input: CreateProjectInput) => {
      const created = await request<Project>('POST', '/api/projects', input);
      await refresh();
      return created;
    },
    updateProject: async (id: string, input: UpdateProjectInput) => {
      const updated = await request<Project>('PATCH', `/api/projects/${id}`, input);
      await refresh();
      return updated;
    },
    /** Area 관리 (D-084). 지우면 그 Project는 Area 없음이 된다 */
    createArea: async (input: CreateAreaInput) => {
      const created = await request<Area>('POST', '/api/areas', input);
      await refresh();
      return created;
    },
    updateArea: async (id: string, input: UpdateAreaInput) => {
      const updated = await request<Area>('PATCH', `/api/areas/${id}`, input);
      await refresh();
      return updated;
    },
    deleteArea: async (id: string) => {
      const result = await request<{ unassignedProjects: number }>('DELETE', `/api/areas/${id}`);
      await refresh();
      return result;
    },
    /** Card는 Inbox로 옮겨진다 (D-016). */
    deleteProject: async (id: string) => {
      const result = await request<{ movedCards: number }>('DELETE', `/api/projects/${id}`);
      await refresh();
      return result;
    },
  };
}
