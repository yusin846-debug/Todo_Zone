import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useSpring, useTransform } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { Card, Project } from '@todo-zone/shared';
import { formatKoreanDate, toDateKey } from '../lib/dates.ts';
import { droplet, drip, dripParent, press, settle } from '../lib/motion.ts';
import { quarterKey } from '../lib/quarter.ts';
import { doneByProject, doneInQuarter, quarterLabel, quarterOptions } from '../lib/review.ts';
import { ProjectIconView } from './icons.tsx';
import styles from './ReviewPage.module.css';

/** 0부터 n까지 물방울 스프링으로 올라가는 숫자 */
function CountUp({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 120, damping: 18 });
  const shown = useTransform(spring, (v) => Math.round(v));
  useEffect(() => spring.set(value), [spring, value]);
  return <motion.span>{shown}</motion.span>;
}

/** Quarterly Review (SCREEN-SPEC S5, PRD F10·F11) */
export function ReviewPage({
  cards,
  projects,
  onReopen,
}: {
  cards: Card[];
  projects: Project[];
  onReopen: (cardId: string) => void;
}) {
  const now = new Date();
  const current = quarterKey(now);
  const options = quarterOptions(cards, now);
  const [selected, setSelected] = useState(current);
  const [direction, setDirection] = useState(0);
  const index = Math.max(0, options.indexOf(selected));
  const key = options[index]!;

  const done = doneInQuarter(cards, key);
  const groups = doneByProject(done, projects);
  const isCurrent = key === current;

  function go(step: number) {
    const next = options[index + step];
    if (!next) return;
    setDirection(step);
    setSelected(next);
  }

  return (
    <main className={styles.page}>
      <nav className={styles.quarterNav} aria-label="분기 고르기">
        <motion.button
          type="button"
          className={styles.navBtn}
          aria-label="이전 분기"
          disabled={index === 0}
          onClick={() => go(-1)}
          {...press}
        >
          <ChevronLeft size={18} />
        </motion.button>
        {options.map((k) => (
          <motion.button
            key={k}
            type="button"
            className={styles.quarterChip}
            aria-pressed={k === key}
            onClick={() => {
              setDirection(options.indexOf(k) > index ? 1 : -1);
              setSelected(k);
            }}
            {...press}
          >
            {k === key && (
              <motion.span
                layoutId="quarter-blob"
                className={styles.quarterBlob}
                transition={droplet}
              />
            )}
            <span className={styles.quarterText}>{quarterLabel(k)}</span>
          </motion.button>
        ))}
        <motion.button
          type="button"
          className={styles.navBtn}
          aria-label="다음 분기"
          disabled={index === options.length - 1}
          onClick={() => go(1)}
          {...press}
        >
          <ChevronRight size={18} />
        </motion.button>
      </nav>

      {/* 분기를 바꾸면 내용이 그 방향에서 미끄러져 들어온다 */}
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.section
          key={key}
          custom={direction}
          variants={{
            enter: (d: number) => ({ x: d * 60, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: d * -60, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={settle}
          aria-label={quarterLabel(key)}
        >
          <h1 className={styles.headline}>
            <span className={styles.light}>
              {isCurrent ? 'This quarter.' : `${quarterLabel(key)}.`}
            </span>
            <span className={styles.heavy}>
              <CountUp value={done.length} /> {done.length === 1 ? 'card' : 'cards'} done.
            </span>
          </h1>

          {done.length === 0 ? (
            <p className={styles.empty}>이 분기에는 끝낸 카드가 없어요.</p>
          ) : (
            <>
              <h2 className={styles.eyebrow}>By project</h2>
              <ul className={styles.bars}>
                {groups.map((g, i) => (
                  <li key={g.project.id} className={styles.barRow}>
                    <span className={styles.barName}>
                      <ProjectIconView icon={g.project.icon} size={16} />
                      {g.project.name}
                    </span>
                    <span className={styles.barTrack}>
                      <motion.span
                        className={styles.barFill}
                        data-color={g.project.color}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(g.ratio * 100, 4)}%` }}
                        transition={{ ...droplet, delay: 0.15 + i * 0.06 }}
                      />
                    </span>
                    <span className={styles.barCount}>{g.cards.length}</span>
                  </li>
                ))}
              </ul>

              <h2 className={styles.eyebrow}>Finished</h2>
              <div className={styles.groups}>
                {groups.map((g) => (
                  <section key={g.project.id} aria-label={`${g.project.name} 완료 목록`}>
                    <h3 className={styles.groupTitle}>
                      <span className={styles.dot} data-color={g.project.color} />
                      {g.project.name}
                    </h3>
                    <motion.ul
                      className={styles.list}
                      variants={dripParent(0.04)}
                      initial="hidden"
                      animate="shown"
                    >
                      <AnimatePresence initial={false}>
                        {g.cards.map((c) => (
                          <motion.li
                            key={c.id}
                            layout
                            variants={drip}
                            exit={{
                              opacity: 0,
                              scale: 0.6,
                              borderRadius: 40,
                              transition: { duration: 0.2 },
                            }}
                            className={styles.item}
                          >
                            <span className={styles.check} data-color={g.project.color}>
                              <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                            </span>
                            <span className={styles.itemTitle}>{c.title}</span>
                            <span className={styles.itemDate}>
                              {formatKoreanDate(toDateKey(new Date(c.completedAt!)))}
                            </span>
                            {!isCurrent && (
                              <motion.button
                                type="button"
                                className={styles.reopen}
                                aria-label={`${c.title} 다시 열기`}
                                onClick={() => onReopen(c.id)}
                                {...press}
                              >
                                <RotateCcw size={13} aria-hidden="true" /> Reopen
                              </motion.button>
                            )}
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </motion.ul>
                  </section>
                ))}
              </div>
            </>
          )}
        </motion.section>
      </AnimatePresence>
    </main>
  );
}
