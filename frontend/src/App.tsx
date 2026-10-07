import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiRequestError, request } from './api/client.ts';
import { Login } from './components/Login.tsx';
import { AnimatePresence, motion } from 'motion/react';
import { useBoardActions, useBoardQuery, useProjectActions, type BoardData } from './api/board.ts';
import { Board } from './components/Board.tsx';
import { CardPanel } from './components/CardPanel.tsx';
import { ProjectsPanel } from './components/ProjectsPanel.tsx';
import { ReviewPage } from './components/ReviewPage.tsx';
import { BoardSkeleton, ServerDown, Toast } from './components/Status.tsx';
import { AreaBento, Footer, Header, Hero } from './components/Top.tsx';
import { toDateKey } from './lib/dates.ts';
import type { Filter } from './lib/areas.ts';
import { settle } from './lib/motion.ts';
import { boardCards } from './lib/quarter.ts';
import { useView, type View } from './lib/useView.ts';
import styles from './App.module.css';

export function App() {
  const client = useQueryClient();
  const session = useQuery({
    queryKey: ['session'],
    queryFn: () =>
      request<{ required: boolean; authenticated: boolean }>('GET', '/api/auth/session'),
    retry: false,
  });
  const [view, setView] = useView();
  const refreshSession = () => {
    void client.resetQueries({ queryKey: ['board'] });
    void client.invalidateQueries({ queryKey: ['session'] });
  };
  const [logoutError, setLogoutError] = useState<string | null>(null);
  if (session.data?.authenticated)
    return (
      <AuthenticatedApp
        onExpired={refreshSession}
        onLogout={
          session.data.required
            ? async () => {
                try {
                  await request('POST', '/api/auth/logout');
                  client.removeQueries({ queryKey: ['board'] });
                  client.setQueryData(['session'], { required: true, authenticated: false });
                } catch (err) {
                  setLogoutError(err instanceof Error ? err.message : '로그아웃하지 못했어요.');
                }
              }
            : undefined
        }
        logoutError={logoutError}
      />
    );
  return (
    <>
      <Header view={view} onView={setView} />
      {session.isPending ? (
        <BoardSkeleton />
      ) : session.isError ? (
        <ServerDown onRetry={() => session.refetch()} />
      ) : (
        <Login onLogin={refreshSession} />
      )}
      <Footer />
    </>
  );
}

function AuthenticatedApp({
  onLogout,
  onExpired,
  logoutError,
}: {
  onLogout?: () => void;
  onExpired: () => void;
  logoutError: string | null;
}) {
  const board = useBoardQuery();
  const [view, setView] = useView();

  return (
    <>
      <Header view={view} onView={setView} onLogout={onLogout} />
      {logoutError && <p role="alert">{logoutError}</p>}
      {board.isPending ? (
        <BoardSkeleton />
      ) : board.isError ? (
        board.error instanceof ApiRequestError && board.error.code === 'UNAUTHORIZED' ? (
          <Login onLogin={onExpired} />
        ) : (
          <ServerDown onRetry={() => board.refetch()} />
        )
      ) : (
        <Ready data={board.data} view={view} />
      )}
      <Footer onLogout={onLogout} />
    </>
  );
}

/** 데이터가 준비된 뒤: Board와 Review가 같은 작업(actions)과 토스트를 쓴다 */
function Ready({ data, view }: { data: BoardData; view: View }) {
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const actions = useBoardActions(setToast);

  return (
    <>
      {/* 화면 전환: 부드럽게 교차 (settle) */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={settle}
        >
          {view === 'board' ? (
            <BoardPage data={data} actions={actions} />
          ) : (
            <ReviewPage
              cards={data.cards}
              areas={data.areas}
              projects={data.projects}
              // 다시 열기 (D-073): Todo 맨 위로
              onReopen={(id) => actions.saveCard(id, {}, 'todo')}
            />
          )}
        </motion.div>
      </AnimatePresence>
      <Toast message={toast} onDone={clearToast} />
    </>
  );
}

type OpenPanel = { kind: 'card'; id: string } | { kind: 'projects' } | null;

function BoardPage({
  data,
  actions,
}: {
  data: BoardData;
  actions: ReturnType<typeof useBoardActions>;
}) {
  const [filter, setFilter] = useState<Filter>(null);
  const [panel, setPanel] = useState<OpenPanel>(null);
  const projectActions = useProjectActions();

  const now = new Date();
  const today = toDateKey(now);
  const inboxId = data.projects.find((p) => p.isInbox)!.id;
  // Board에는 Todo·Doing과 이번 분기 Done만 보인다. 지난 분기 Done은 Quarterly Review로 (D-072, D-075).
  const visible = boardCards(data.cards, now);
  const openCard = panel?.kind === 'card' ? data.cards.find((c) => c.id === panel.id) : undefined;
  // 지운 Project·Area의 필터가 남아 있지 않게 한다
  const activeFilter: Filter =
    filter === null
      ? null
      : (filter.kind === 'project' ? data.projects : data.areas).some((x) => x.id === filter.id)
        ? filter
        : null;
  // 새 Card: Project 필터면 그 Project, 그 밖(필터 없음, Area 필터)은 Inbox (D-018, D-087)
  const newCardProject = activeFilter?.kind === 'project' ? activeFilter.id : inboxId;

  return (
    <>
      {/* 패널이 열리면 데스크톱에서 Board가 패널 폭만큼 좁아져 계속 보인다 (D-047) */}
      <div className={styles.page} data-panel-open={panel !== null}>
        <Hero cards={visible} today={today} hour={now.getHours()} />
        <AreaBento
          today={today}
          areas={data.areas}
          projects={data.projects}
          cards={visible}
          filter={activeFilter}
          onFilter={setFilter}
          onManage={() => setPanel({ kind: 'projects' })}
        />
        <Board
          cards={visible}
          areas={data.areas}
          projects={data.projects}
          filter={activeFilter}
          today={today}
          onAdd={(title, status) => actions.createCard(title, status, newCardProject)}
          onOpenCard={(id) => setPanel({ kind: 'card', id })}
          drag={{
            start: actions.startDrag,
            preview: actions.previewMove,
            commit: actions.commitMove,
            cancel: actions.cancelDrag,
          }}
        />
      </div>

      <AnimatePresence>
        {openCard && (
          <CardPanel
            key={openCard.id}
            card={openCard}
            areas={data.areas}
            projects={data.projects}
            today={today}
            onSave={(patch, status) => actions.saveCard(openCard.id, patch, status)}
            onDelete={() => actions.deleteCard(openCard.id)}
            onClose={() => setPanel(null)}
          />
        )}
        {panel?.kind === 'projects' && (
          <ProjectsPanel
            key="projects"
            areas={data.areas}
            projects={data.projects}
            cards={data.cards}
            actions={projectActions}
            onClose={() => setPanel(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
