import { useState } from 'react';
import { Board } from './components/Board.tsx';
import { Header, Hero, ProjectTags } from './components/Top.tsx';
import { makeSampleBoard } from './dev/sampleData.ts';
import { toDateKey } from './lib/dates.ts';
import { useBoard } from './state/useBoard.ts';

// step11-2: 가짜 데이터로 Board를 그린다. 서버 연결은 11-4.
export function App() {
  const now = new Date();
  const today = toDateKey(now);
  const board = useBoard(() => makeSampleBoard(today));
  const [filter, setFilter] = useState<string | null>(null);

  const inboxId = board.projects.find((p) => p.isInbox)!.id;

  return (
    <>
      <Header />
      <Hero cards={board.cards} today={today} hour={now.getHours()} />
      <ProjectTags
        projects={board.projects}
        cards={board.cards}
        filter={filter}
        onFilter={setFilter}
      />
      <Board
        cards={board.cards}
        projects={board.projects}
        filter={filter}
        today={today}
        onAdd={(title, status) => board.addCard(title, status, filter ?? inboxId)}
        onMove={board.moveCard}
      />
    </>
  );
}
