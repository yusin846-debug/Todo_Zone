import { useId, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { droplet } from '../lib/motion.ts';
import styles from './Segmented.module.css';

/**
 * 몇 칸짜리 토글 (Status, Board/Review). 선택 표시가 물방울처럼 흘러가서
 * 옆으로 살짝 늘어났다가 동그랗게 자리 잡는다 (SCREEN-SPEC 1.5).
 * 키보드: 방향키로 옮긴다 (radiogroup).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  tone = 'dark',
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  /** dark: 패널 안 / header: 헤더 위 */
  tone?: 'dark' | 'header';
}) {
  const layoutId = useId();
  const index = options.findIndex((o) => o.value === value);

  function onKeyDown(e: KeyboardEvent) {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0;
    if (step === 0) return;
    e.preventDefault();
    const next = options[(index + step + options.length) % options.length]!;
    onChange(next.value);
    (e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)?.focus();
  }

  return (
    <div
      className={styles.group}
      data-tone={tone}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <motion.button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            data-value={o.value}
            className={styles.option}
            whileTap={{ scale: 0.92 }}
            transition={droplet}
            onClick={() => onChange(o.value)}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                className={styles.blob}
                initial={{ scaleX: 1.22, scaleY: 0.82 }}
                animate={{ scaleX: 1, scaleY: 1 }}
                transition={droplet}
              />
            )}
            <span className={styles.text}>{o.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
