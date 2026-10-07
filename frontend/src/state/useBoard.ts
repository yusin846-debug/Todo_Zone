import { useReducer } from 'react';
import type { Card, Project, Status } from '@todo-zone/shared';
import { addCard, moveCard } from '../lib/board.ts';

// step11-2: 브라우저 메모리에만 있는 Board 상태. 11-4에서 서버(TanStack Query)로 바뀐다.

type State = { projects: Project[]; cards: Card[] };

type Action =
  | { type: 'add'; id: string; title: string; status: Status; projectId: string; now: string }
  | { type: 'move'; cardId: string; toStatus: Status; afterId: string | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      return {
        ...state,
        cards: addCard(
          state.cards,
          {
            id: action.id,
            title: action.title,
            status: action.status,
            projectId: action.projectId,
          },
          action.now,
        ),
      };
    case 'move':
      return {
        ...state,
        cards: moveCard(state.cards, action.cardId, action.toStatus, action.afterId),
      };
  }
}

export function useBoard(initial: () => State) {
  const [state, dispatch] = useReducer(reducer, undefined, initial);
  return {
    ...state,
    addCard: (title: string, status: Status, projectId: string) =>
      dispatch({
        type: 'add',
        id: crypto.randomUUID(),
        title,
        status,
        projectId,
        now: new Date().toISOString(),
      }),
    moveCard: (cardId: string, toStatus: Status, afterId: string | null) =>
      dispatch({ type: 'move', cardId, toStatus, afterId }),
  };
}
