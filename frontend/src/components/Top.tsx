import type { Card, Project } from '@todo-zone/shared';
import { progressOf, summarize } from '../lib/board.ts';
import { eyebrowDate, greeting } from '../lib/dates.ts';
import { Plus } from 'lucide-react';
import type { View } from '../lib/useView.ts';
import { ProjectIconView } from './icons.tsx';
import { Segmented } from './Segmented.tsx';
import styles from './Top.module.css';

/** 헤더: 워드마크 / Board·Review 전환(D-081) / 한 줄 */
export function Header({ view, onView }: { view: View; onView: (view: View) => void }) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        to-do zone<sup aria-hidden="true">✳</sup>
      </div>
      <div className={styles.viewSwitch}>
        <Segmented
          label="화면"
          tone="header"
          options={[
            { value: 'board', label: 'Board' },
            { value: 'review', label: 'Review' },
          ]}
          value={view}
          onChange={onView}
        />
      </div>
      <div className={styles.note}>One card at a time.</div>
    </header>
  );
}

/** SCREEN-SPEC S1 Hero (D-064). 요약은 필터와 무관하게 Board 전체 기준. */
export function Hero({ cards, today, hour }: { cards: Card[]; today: string; hour: number }) {
  const { doing, dueToday, overdue } = summarize(cards, today);
  const empty = doing === 0 && dueToday === 0 && overdue === 0;

  return (
    <section className={styles.hero}>
      <div>
        <div className={styles.eyebrow}>{eyebrowDate(today)}</div>
        <h1 className={styles.greeting}>
          <span className={styles.light}>{greeting(hour)}</span>
          <span className={styles.heavy}>Let's move cards.</span>
        </h1>
      </div>
      <p className={styles.summary}>
        {empty ? (
          '오늘은 여유로운 날이에요.'
        ) : (
          <>
            진행 중인 카드 <b>{doing}장</b>, 오늘 마감 <b>{dueToday}장</b>
            {overdue > 0 && (
              <>
                <br />
                지난 마감 <b>{overdue}장</b>이 기다리고 있어요.
              </>
            )}
          </>
        )}
      </p>
    </section>
  );
}

/** Project 태그 + 필터 (F9, D-033) */
export function ProjectTags({
  projects,
  cards,
  filter,
  onFilter,
  onManage,
}: {
  projects: Project[];
  cards: Card[];
  filter: string | null;
  onFilter: (projectId: string | null) => void;
  /** + New project: Projects 관리 패널(S3)을 연다 */
  onManage: () => void;
}) {
  const ordered = [...projects].sort(
    (a, b) => Number(b.isInbox) - Number(a.isInbox) || a.createdAt.localeCompare(b.createdAt),
  );

  return (
    <nav className={styles.tags} aria-label="Projects">
      {ordered.map((p) => {
        const { done, total, ratio } = progressOf(cards, p.id);
        const selected = filter === p.id;
        return (
          <button
            key={p.id}
            type="button"
            className={styles.tag}
            data-color={p.color}
            data-dimmed={filter !== null && !selected}
            aria-pressed={selected}
            onClick={() => onFilter(selected ? null : p.id)}
          >
            <span className={styles.tagName}>
              <ProjectIconView icon={p.icon} size={18} />
              {p.name}
            </span>
            <span className={styles.tagCount}>
              {done} / {total}
            </span>
            <span className={styles.bar} aria-hidden="true">
              <i style={{ width: `${Math.round(ratio * 100)}%` }} />
            </span>
          </button>
        );
      })}
      <button type="button" className={styles.tagAdd} onClick={onManage}>
        <Plus size={15} aria-hidden="true" /> New project
      </button>
    </nav>
  );
}
