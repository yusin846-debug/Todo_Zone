import { useEffect, useRef } from 'react';
import styles from './Panel.module.css';

/**
 * 확인 대화상자 (SCREEN-SPEC 4장 D1~D3). 기본 포커스는 Cancel:
 * 실수로 Enter를 눌러도 지워지지 않게 한다. Esc는 취소.
 */
export function ConfirmDialog({
  message,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => cancelRef.current?.focus(), []);

  return (
    <div className={styles.backdrop} onMouseDown={onCancel}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-label={message}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            onCancel();
          }
        }}
      >
        <p>{message}</p>
        <div className={styles.dialogActions}>
          <button ref={cancelRef} type="button" className={styles.ghostBtn} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={danger ? styles.dangerBtn : styles.primaryBtn}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
