import { useEffect } from 'react';
import styles from './Status.module.css';

// SCREEN-SPEC S4 상태 화면. 문구는 SCREEN-SPEC 4장 문구표.

/** 로딩: 열마다 높이가 다른 자리표시 2장 */
export function BoardSkeleton() {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-label="불러오는 중">
      {[0, 1, 2].map((col) => (
        <div key={col} className={styles.skeletonCol}>
          <span style={{ height: 120 }} />
          <span style={{ height: 64 }} />
        </div>
      ))}
    </div>
  );
}

/** E4: 첫 진입 때 서버에 연결할 수 없음 */
export function ServerDown({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={styles.down} role="alert">
      <p>서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요.</p>
      <button type="button" className={styles.retry} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

/** T1 등: 화면 아래 가운데 토스트. 4초 뒤 사라진다. */
export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (message === null) return;
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  if (message === null) return null;
  return (
    <div className={styles.toast} role="status">
      {message}
    </div>
  );
}
