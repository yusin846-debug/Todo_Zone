import { useCallback, useState } from 'react';
import { useBoardActions, useBoardQuery, useProjectActions, type BoardData } from './api/board.ts';
import { Board } from './components/Board.tsx';
import { CardPanel } from './components/CardPanel.tsx';
import { ProjectsPanel } from './components/ProjectsPanel.tsx';
import { BoardSkeleton, ServerDown, Toast } from './components/Status.tsx';
import { Header, Hero, ProjectTags } from './components/Top.tsx';
import { toDateKey } from './lib/dates.ts';
import { boardCards } from './lib/quarter.ts';
import styles from './App.module.css';

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

type OpenPanel = { kind: 'card'; id: string } | { kind: 'projects' } | null;

function BoardPage({ data }: { data: BoardData }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [panel, setPanel] = useState<OpenPanel>(null);
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const actions = useBoardActions(setToast);
  const projectActions = useProjectActions();

  const now = new Date();
  const today = toDateKey(now);
  const inboxId = data.projects.find((p) => p.isInbox)!.id;
  // Board에는 Todo·Doing과 이번 분기 Done만 보인다. 지난 분기 Done은 Quarterly Review로 (D-072, D-075).
  const visible = boardCards(data.cards, now);
  const openCard = panel?.kind === 'card' ? data.cards.find((c) => c.id === panel.id) : undefined;
  // 지운 Project의 필터가 남아 있지 않게 한다
  const activeFilter = filter && data.projects.some((p) => p.id === filter) ? filter : null;

  return (
    <>
      {/* 패널이 열리면 데스크톱에서 Board가 패널 폭만큼 좁아져 계속 보인다 (D-047) */}
      <div className={styles.page} data-panel-open={panel !== null}>
        <Hero cards={visible} today={today} hour={now.getHours()} />
        <ProjectTags
          projects={data.projects}
          cards={visible}
          filter={activeFilter}
          onFilter={setFilter}
          onManage={() => setPanel({ kind: 'projects' })}
        />
        <Board
          cards={visible}
          projects={data.projects}
          filter={activeFilter}
          today={today}
          onAdd={(title, status) => actions.createCard(title, status, activeFilter ?? inboxId)}
          onOpenCard={(id) => setPanel({ kind: 'card', id })}
          drag={{
            start: actions.startDrag,
            preview: actions.previewMove,
            commit: actions.commitMove,
            cancel: actions.cancelDrag,
          }}
        />
      </div>

      {openCard && (
        <CardPanel
          key={openCard.id}
          card={openCard}
          projects={data.projects}
          onSave={(patch, status) => actions.saveCard(openCard.id, patch, status)}
          onDelete={() => actions.deleteCard(openCard.id)}
          onClose={() => setPanel(null)}
        />
      )}
      {panel?.kind === 'projects' && (
        <ProjectsPanel
          projects={data.projects}
          cards={data.cards}
          actions={projectActions}
          onClose={() => setPanel(null)}
        />
      )}
      <Toast message={toast} onDone={clearToast} />
    </>
  );
}
