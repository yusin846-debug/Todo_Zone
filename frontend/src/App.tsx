import { useCallback, useState } from 'react';
import { useBoardActions, useBoardQuery, type BoardData } from './api/board.ts';
import { Board } from './components/Board.tsx';
import { BoardSkeleton, ServerDown, Toast } from './components/Status.tsx';
import { Header, Hero, ProjectTags } from './components/Top.tsx';
import { toDateKey } from './lib/dates.ts';
import { boardCards } from './lib/quarter.ts';

export function App() {
  const board = useBoardQuery();

  return (
    <>
      <Header />
      {board.isPending ? (
        <BoardSkeleton />
      ) : board.isError ? (
        <ServerDown onRetry={() => board.refetch()} />
      ) : (
        <BoardPage data={board.data} />
      )}
    </>
  );
}

function BoardPage({ data }: { data: BoardData }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const actions = useBoardActions(setToast);

  const now = new Date();
  const today = toDateKey(now);
  const inboxId = data.projects.find((p) => p.isInbox)!.id;
  // Board에는 Todo·Doing과 이번 분기 Done만 보인다. 지난 분기 Done은 Quarterly Review로 (D-072, D-075).
  const visible = boardCards(data.cards, now);

  return (
    <>
      <Hero cards={visible} today={today} hour={now.getHours()} />
      <ProjectTags projects={data.projects} cards={visible} filter={filter} onFilter={setFilter} />
      <Board
        cards={visible}
        projects={data.projects}
        filter={filter}
        today={today}
        onAdd={(title, status) => actions.createCard(title, status, filter ?? inboxId)}
        drag={{
          start: actions.startDrag,
          preview: actions.previewMove,
          commit: actions.commitMove,
          cancel: actions.cancelDrag,
        }}
      />
      <Toast message={toast} onDone={clearToast} />
    </>
  );
}
