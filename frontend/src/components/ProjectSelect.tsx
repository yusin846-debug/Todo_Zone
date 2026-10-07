import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import type { Project } from '@todo-zone/shared';
import { drip, dripParent, press } from '../lib/motion.ts';
import { ProjectIconView } from './icons.tsx';
import { Popover } from './Popover.tsx';
import styles from './Pickers.module.css';

/** Project 고르기 (D-080). 색 점 + 아이콘 + 이름, 방향키·Enter·Esc. */
export function ProjectSelect({
  projects,
  value,
  onChange,
}: {
  projects: Project[];
  value: string;
  onChange: (projectId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const current = projects.find((p) => p.id === value);

  useEffect(() => {
    if (!open) return;
    setActive(
      Math.max(
        0,
        projects.findIndex((p) => p.id === value),
      ),
    );
    requestAnimationFrame(() => listRef.current?.focus());
  }, [open, projects, value]);

  function choose(index: number) {
    const p = projects[index];
    if (p) onChange(p.id);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onClose={close}
      label="Project 고르기"
      trigger={
        <motion.button
          type="button"
          data-trigger
          className={styles.trigger}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Project: ${current?.name ?? ''}`}
          onClick={() => setOpen((v) => !v)}
          {...press}
        >
          {current && (
            <>
              <span className={styles.dot} data-color={current.color} />
              <ProjectIconView icon={current.icon} size={16} />
              <span className={styles.triggerText}>{current.name}</span>
            </>
          )}
          <motion.span animate={{ rotate: open ? 180 : 0 }} className={styles.chevron}>
            <ChevronDown size={16} aria-hidden="true" />
          </motion.span>
        </motion.button>
      }
    >
      <motion.ul
        ref={listRef}
        role="listbox"
        aria-label="Project"
        tabIndex={-1}
        aria-activedescendant={`project-opt-${active}`}
        className={styles.list}
        variants={dripParent(0.03)}
        initial="hidden"
        animate="shown"
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setActive((i) => Math.min(projects.length - 1, i + 1));
          else if (e.key === 'ArrowUp') setActive((i) => Math.max(0, i - 1));
          else if (e.key === 'Enter') choose(active);
          else return;
          e.preventDefault();
        }}
      >
        {projects.map((p, i) => (
          <motion.li
            key={p.id}
            id={`project-opt-${i}`}
            role="option"
            aria-selected={p.id === value}
            data-active={i === active}
            className={styles.option}
            variants={drip}
            whileTap={{ scale: 0.96 }}
            onMouseEnter={() => setActive(i)}
            onClick={() => choose(i)}
          >
            <span className={styles.dot} data-color={p.color} />
            <ProjectIconView icon={p.icon} size={16} />
            {p.name}
          </motion.li>
        ))}
      </motion.ul>
    </Popover>
  );
}
