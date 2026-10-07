import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { STATUSES, type Card, type Project, type Status } from '@todo-zone/shared';
import { cardTier, columnCards } from '../lib/board.ts';
import { LiftedCard, SortableCard } from './CardItem.tsx';
import { NewCardInput } from './NewCardInput.tsx';
import styles from './Board.module.css';

const COLUMN = {
  todo: { label: '01 / To do', title: 'Todo', empty: '비어 있어요' },
  doing: { label: '02 / In progress', title: 'Doing', empty: '비어 있어요' },
  done: { label: '03 / Finished', title: 'Done', empty: '비어 있어요' },
} as const;

const DONE_COLLAPSED_KEY = 'todo-zone:done-collapsed'; // D-045

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(DONE_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

type Props = {
  cards: Card[];
  projects: Project[];
  filter: string | null;
  today: string;
  onAdd: (title: string, status: Status) => void;
  /** 드래그 흐름: 시작 → (미리보기 이동 …) → 놓기(서버 저장) 또는 취소(되돌리기) */
  drag: {
    start: () => void;
    preview: (cardId: string, toStatus: Status, afterId: string | null) => void;
    commit: (cardId: string) => void;
    cancel: () => void;
  };
};

export function Board({ cards, projects, filter, today, onAdd, drag }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [composing, setComposing] = useState<Status | null>(null);
  const [doneCollapsed, setDoneCollapsed] = useState(readCollapsed);

  // 마우스와 키보드만. 터치(모바일)는 드래그 대신 상세 패널의 Status 변경을 쓴다 (D-021).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const projectOf = (id: string) => projects.find((p) => p.id === id)!;
  const visible = (status: Status) => columnCards(cards, status, filter);
  const statusOf = (id: string): Status | null => {
    if (id.startsWith('column:')) return id.slice('column:'.length) as Status;
    return cards.find((c) => c.id === id)?.status ?? null;
  };

  // 다른 열 위로 들어가면 바로 그 열로 옮겨서 미리 보여준다. 들어간 Card의 앞자리에 끼운다.
  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const from = statusOf(String(active.id));
    const to = statusOf(String(over.id));
    if (!from || !to || from === to) return;

    const list = visible(to);
    const overIndex = list.findIndex((c) => c.id === over.id);
    const afterId =
      overIndex === -1 ? (list.at(-1)?.id ?? null) : (list[overIndex - 1]?.id ?? null);
    drag.preview(String(active.id), to, afterId);
  }

  // 같은 열 안의 최종 위치를 정하고, 최종 결과를 한 번만 서버에 저장한다.
  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const id = String(active.id);
    const status = statusOf(id);
    if (
      over &&
      active.id !== over.id &&
      status &&
      statusOf(String(over.id)) === status &&
      !String(over.id).startsWith('column:')
    ) {
      const ids = visible(status).map((c) => c.id);
      const from = ids.indexOf(id);
      const to = ids.indexOf(String(over.id));
      ids.splice(from, 1);
      ids.splice(to, 0, id);
      drag.preview(id, status, ids[to - 1] ?? null);
    }
    drag.commit(id);
  }

  function toggleDone() {
    setDoneCollapsed((v) => {
      try {
        localStorage.setItem(DONE_COLLAPSED_KEY, v ? '0' : '1');
      } catch {
        // 저장할 수 없어도 화면 상태는 바뀐다
      }
      return !v;
    });
  }

  const active = activeId ? cards.find((c) => c.id === activeId) : undefined;
  const focusId = visible('doing')[0]?.id;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }: DragStartEvent) => {
        setActiveId(String(active.id));
        drag.start();
      }}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        drag.cancel();
      }}
    >
      <main className={styles.board}>
        {STATUSES.map((status) => {
          const list = visible(status);
          const collapsed = status === 'done' && doneCollapsed;
          return (
            <Column key={status} status={status}>
              <div className={styles.colHead}>
                <div>
                  <div className={styles.colLabel}>{COLUMN[status].label}</div>
                  <h2 className={styles.colTitle}>
                    {COLUMN[status].title} <b>{list.length}</b>
                  </h2>
                </div>
                <div className={styles.colActions}>
                  <button
                    type="button"
                    className={styles.pillBtn}
                    onClick={() => setComposing(status)}
                  >
                    <Plus size={14} aria-hidden="true" /> New card
                  </button>
                  {status === 'done' && (
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={collapsed ? 'Done 열 펼치기' : 'Done 열 접기'}
                      aria-expanded={!collapsed}
                      onClick={toggleDone}
                    >
                      {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                  )}
                </div>
              </div>

              {composing === status && (
                <NewCardInput
                  onCreate={(title) => onAdd(title, status)}
                  onClose={() => setComposing(null)}
                />
              )}

              {!collapsed && (
                <SortableContext
                  items={list.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className={styles.stack}>
                    {list.map((card) => (
                      <SortableCard
                        key={card.id}
                        card={card}
                        project={projectOf(card.projectId)}
                        tier={cardTier(card, card.id === focusId)}
                        today={today}
                      />
                    ))}
                    {list.length === 0 && (
                      <p className={styles.empty}>
                        {filter !== null
                          ? '이 Project에는 아직 카드가 없어요'
                          : COLUMN[status].empty}
                      </p>
                    )}
                  </div>
                </SortableContext>
              )}
            </Column>
          );
        })}
      </main>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease-out' }}>
        {active && (
          <LiftedCard
            card={active}
            project={projectOf(active.projectId)}
            tier={cardTier(active, active.id === focusId)}
            today={today}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}

/** 빈 열이나 접힌 Done 열에도 놓을 수 있게 열 전체를 드롭 영역으로 만든다. */
function Column({ status, children }: { status: Status; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: `column:${status}` });
  return (
    <section
      ref={setNodeRef}
      className={styles.column}
      data-status={status}
      aria-label={COLUMN[status].title}
    >
      {children}
    </section>
  );
}
