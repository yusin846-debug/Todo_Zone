import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, formatKoreanDate, monthGrid, nextWeekMonday, nextWeekday } from '../lib/dates.ts';
import { droplet, press } from '../lib/motion.ts';
import { Popover } from './Popover.tsx';
import styles from './Pickers.module.css';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * Due date 고르기 (D-080). 빠른 선택 + 한글 미니 달력.
 * 달을 넘기면 좌우로 미끄러지고, 선택한 날의 동그라미가 새 날짜로 흘러간다.
 */
export function DatePicker({
  value,
  today,
  onChange,
}: {
  value: string | null;
  today: string;
  onChange: (date: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const base = value ?? today;
  const [view, setView] = useState({ y: +base.slice(0, 4), m: +base.slice(5, 7) });
  const [direction, setDirection] = useState(0);
  const [focused, setFocused] = useState(base);
  const gridRef = useRef<HTMLDivElement>(null);
  const bubbleId = useId();
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const start = value ?? today;
    setView({ y: +start.slice(0, 4), m: +start.slice(5, 7) });
    setFocused(start);
    // 처음 열 때는 달력의 그날로 포커스
    requestAnimationFrame(() =>
      gridRef.current?.querySelector<HTMLElement>(`[data-date="${start}"]`)?.focus(),
    );
  }, [open, value, today]);

  function shiftMonth(step: number) {
    setDirection(step);
    setView(({ y, m }) => {
      const next = m + step;
      return next < 1 ? { y: y - 1, m: 12 } : next > 12 ? { y: y + 1, m: 1 } : { y, m: next };
    });
  }

  function pick(date: string | null) {
    onChange(date);
    setOpen(false);
  }

  // 방향키로 날짜 이동, 달이 바뀌면 달력도 넘긴다
  function moveFocus(days: number) {
    const next = addDays(focused, days);
    const ny = +next.slice(0, 4);
    const nm = +next.slice(5, 7);
    if (ny !== view.y || nm !== view.m) {
      setDirection(days > 0 ? 1 : -1);
      setView({ y: ny, m: nm });
    }
    setFocused(next);
    requestAnimationFrame(() =>
      gridRef.current?.querySelector<HTMLElement>(`[data-date="${next}"]`)?.focus(),
    );
  }

  const quick: [string, string | null][] = [
    ['오늘', today],
    ['내일', addDays(today, 1)],
    ['금요일', nextWeekday(today, 5)],
    ['다음 주 월', nextWeekMonday(today)],
  ];
  const monthKey = `${view.y}-${String(view.m).padStart(2, '0')}`;

  return (
    <Popover
      open={open}
      onClose={close}
      label="날짜 고르기"
      trigger={
        <motion.button
          type="button"
          data-trigger
          className={styles.trigger}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`Due date: ${value ? formatKoreanDate(value) : '날짜 없음'}`}
          onClick={() => setOpen((v) => !v)}
          {...press}
        >
          <Calendar size={16} aria-hidden="true" />
          <span className={styles.triggerText} data-empty={value === null}>
            {value ? formatKoreanDate(value) : '날짜 없음'}
          </span>
        </motion.button>
      }
    >
      <div className={styles.quick}>
        {quick.map(([label, date]) => (
          <motion.button
            key={label}
            type="button"
            className={styles.chip}
            data-on={date === value}
            onClick={() => pick(date)}
            {...press}
          >
            {label}
          </motion.button>
        ))}
        {value && (
          <motion.button
            type="button"
            className={styles.chip}
            data-clear
            onClick={() => pick(null)}
            {...press}
          >
            지우기
          </motion.button>
        )}
      </div>

      <div className={styles.monthHead}>
        <button
          type="button"
          className={styles.navBtn}
          aria-label="이전 달"
          onClick={() => shiftMonth(-1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span className={styles.monthTitle}>
          {view.y}년 {view.m}월
        </span>
        <button
          type="button"
          className={styles.navBtn}
          aria-label="다음 달"
          onClick={() => shiftMonth(1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className={styles.monthClip}>
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={monthKey}
            ref={gridRef}
            role="grid"
            aria-label={`${view.y}년 ${view.m}월`}
            className={styles.days}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: d * 40, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d * -40, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={droplet}
            onKeyDown={(e) => {
              const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
              if (step) {
                e.preventDefault();
                moveFocus(step);
              }
            }}
          >
            {monthGrid(view.y, view.m).map((date) => {
              const inMonth = +date.slice(5, 7) === view.m;
              const selected = date === value;
              return (
                <button
                  key={date}
                  type="button"
                  data-date={date}
                  className={styles.day}
                  data-out={!inMonth}
                  data-today={date === today}
                  aria-pressed={selected}
                  aria-label={formatKoreanDate(date)}
                  tabIndex={date === focused ? 0 : -1}
                  onClick={() => pick(date)}
                >
                  {selected && (
                    <motion.span
                      layoutId={bubbleId}
                      className={styles.dayBubble}
                      transition={droplet}
                    />
                  )}
                  <span className={styles.dayNum}>{+date.slice(8)}</span>
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </Popover>
  );
}
