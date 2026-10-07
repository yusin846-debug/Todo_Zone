import type { Area, Card, Project } from '@todo-zone/shared';
import { motion } from 'motion/react';
import { groupProjects, type Filter } from '../lib/areas.ts';
import { progressOf, summarize } from '../lib/board.ts';
import { eyebrowDate, greeting } from '../lib/dates.ts';
import { Plus } from 'lucide-react';
import { droplet, drip, dripParent, press } from '../lib/motion.ts';
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

/**
 * Area 벤토 (D-089, SCREEN-SPEC S1). Area마다 유리 타일 하나:
 * 큰 숫자(열린 카드), 진행 중·지난 마감, 그 Area의 Project 칩.
 * 타일을 누르면 Area 필터, 칩을 누르면 Project 필터. 필터는 한 번에 하나 (D-033, D-085).
 */
export function AreaBento({
  areas,
  projects,
  cards,
  today,
  filter,
  onFilter,
  onManage,
}: {
  areas: Area[];
  projects: Project[];
  cards: Card[];
  today: string;
  filter: Filter;
  onFilter: (filter: Filter) => void;
  /** + New project: Projects 관리 패널(S3)을 연다 */
  onManage: () => void;
}) {
  const groups = groupProjects(areas, projects);
  const isOn = (kind: 'area' | 'project', id: string) => filter?.kind === kind && filter.id === id;

  return (
    <nav className={styles.bentoWrap} aria-label="Projects">
      {/* 유리 뒤에서 비치는 Area 색 빛 (글래스모피즘은 뒤에 색이 있어야 보인다) */}
      <div className={styles.glow} aria-hidden="true">
        {areas.map((a) => (
          <span key={a.id} data-color={a.color} />
        ))}
      </div>
      <motion.div
        className={styles.bento}
        variants={dripParent(0.05)}
        initial="hidden"
        animate="shown"
      >
        {groups.map((g) => {
          const ids = new Set(g.projects.map((p) => p.id));
          const mine = cards.filter((c) => ids.has(c.projectId));
          const open = mine.filter((c) => c.status !== 'done');
          const doing = mine.filter((c) => c.status === 'doing').length;
          const done = mine.filter((c) => c.status === 'done').length;
          const overdue = open.filter((c) => c.dueDate !== null && c.dueDate < today).length;
          const areaOn = g.area !== null && isOn('area', g.area.id);
          const projectOn = g.projects.some((p) => isOn('project', p.id));
          const dimmed = filter !== null && !areaOn && !projectOn;
          return (
            <motion.div
              key={g.area?.id ?? 'unsorted'}
              className={styles.tile}
              data-color={g.area?.color ?? 'inbox'}
              data-kind={g.area ? 'area' : 'unsorted'}
              data-on={areaOn}
              data-dimmed={dimmed}
              variants={drip}
              layout
              transition={droplet}
            >
              {g.area && (
                // 타일 전체를 덮는 필터 버튼. Project 칩은 이 위에 놓인다
                <motion.button
                  type="button"
                  className={styles.tileHit}
                  aria-pressed={areaOn}
                  aria-label={`${g.area.name} Area 전체`}
                  onClick={() => onFilter(areaOn ? null : { kind: 'area', id: g.area!.id })}
                  whileTap={{ scale: 0.98 }}
                />
              )}
              <div className={styles.tileHead}>
                <span className={styles.tileName}>{g.area?.name ?? 'Unsorted'}</span>
                <span className={styles.tileDone}>{done} done</span>
              </div>
              <div className={styles.tileBig}>
                {open.length}
                <small>open{doing > 0 && ` · ${doing} doing`}</small>
              </div>
              {overdue > 0 && <div className={styles.tileOverdue}>지난 마감 {overdue}장</div>}
              <div className={styles.chips}>
                {g.projects.map((p) => {
                  const selected = isOn('project', p.id);
                  const { done: pd, total } = progressOf(cards, p.id);
                  return (
                    <motion.button
                      key={p.id}
                      type="button"
                      className={styles.chip}
                      aria-pressed={selected}
                      aria-label={`${p.name} ${pd}/${total}`}
                      title={`${p.name} · ${pd} / ${total}`}
                      onClick={() => onFilter(selected ? null : { kind: 'project', id: p.id })}
                      {...press}
                    >
                      <ProjectIconView icon={p.icon} size={14} />
                      <span>{p.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
      <button type="button" className={styles.tagAdd} onClick={onManage}>
        <Plus size={15} aria-hidden="true" /> New project
      </button>
    </nav>
  );
}
