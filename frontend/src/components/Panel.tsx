import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { settle } from '../lib/motion.ts';
import styles from './Panel.module.css';

/**
 * 오른쪽 400px 패널 (데스크톱) / 전체 화면 시트 (모바일). SCREEN-SPEC S2·S3, D-047.
 * 열리면 포커스를 안으로 옮기고, 닫히면 연 요소로 돌려준다 (SCREEN-SPEC 5장).
 */
export function Panel({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => opener?.focus?.();
  }, []);

  return (
    <motion.aside
      ref={ref}
      className={styles.panel}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={settle}
      role="dialog"
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div className={styles.panelHead}>
        <span className={styles.eyebrow}>{title}</span>
        <button type="button" className={styles.ghostBtn} aria-label="패널 닫기" onClick={onClose}>
          Close <X size={14} aria-hidden="true" />
        </button>
      </div>
      <div className={styles.panelBody} data-scroll-area>
        {children}
      </div>
      {footer && <div className={styles.panelFoot}>{footer}</div>}
    </motion.aside>
  );
}
