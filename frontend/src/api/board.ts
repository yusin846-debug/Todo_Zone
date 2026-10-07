import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addCard, moveCard, type Card, type Project, type Status } from '@todo-zone/shared';
import { request } from './client.ts';

// Board 데이터의 서버 연결 (step11-4, D-038).
// 화면은 캐시를 먼저 바꾸고(낙관적 업데이트), 서버가 실패하면 되돌린다.

export type BoardData = { projects: Project[]; cards: Card[] };

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

  return {
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
