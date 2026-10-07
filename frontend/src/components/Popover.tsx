import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { bloom } from '../lib/motion.ts';
import styles from './Pickers.module.css';

/**
 * 트리거 아래로 물방울처럼 맺히는 팝오버 (SCREEN-SPEC 1.5 bloom).
 * 바깥을 누르거나 Esc를 누르면 닫히고, 포커스는 트리거로 돌아간다.
 */
export function Popover({
  open,
  onClose,
  trigger,
  children,
  label,
}: {
  open: boolean;
  onClose: () => void;
  trigger: ReactNode;
  children: ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // 아래 공간이 모자라면 위로 연다 (패널 아래쪽에서 목록이 잘리지 않게)
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');

  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    // 패널처럼 스크롤되는 영역 안이면 그 영역의 아래 끝을 기준으로 잰다
    const rect = ref.current.getBoundingClientRect();
    const area = ref.current.closest('[data-scroll-area]')?.getBoundingClientRect();
    const bottom = area?.bottom ?? window.innerHeight;
    const top = area?.top ?? 0;
    const below = bottom - rect.bottom;
    const above = rect.top - top;
    setPlacement(below < 340 && above > below ? 'top' : 'bottom');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      className={styles.anchor}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation(); // 패널까지 닫히지 않게
          onClose();
          ref.current?.querySelector<HTMLElement>('[data-trigger]')?.focus();
        }
      }}
    >
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.popover}
            data-placement={placement}
            role="dialog"
            aria-label={label}
            variants={bloom}
            initial="hidden"
            animate="shown"
            exit="gone"
            style={{ transformOrigin: placement === 'top' ? 'bottom left' : 'top left' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
