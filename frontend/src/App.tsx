import { useEffect, useState } from 'react';
import type { HealthResponse } from '@todo-zone/shared';
import styles from './App.module.css';

type ApiState = 'checking' | 'ok' | 'down';

// step11-1: 화면과 /api 프록시 연결만 확인하는 임시 화면. Board는 step11-2에서 만든다.
export function App() {
  const [api, setApi] = useState<ApiState>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? (res.json() as Promise<HealthResponse>) : Promise.reject()))
      .then((body) => setApi(body.status === 'ok' ? 'ok' : 'down'))
      .catch(() => setApi('down'));
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <div className={styles.logo}>
          to-do zone<sup>✳</sup>
        </div>
        <div className={styles.note}>One card at a time.</div>
      </header>
      <main className={styles.main}>
        <p className={styles.status} data-state={api} role="status">
          {api === 'checking' && '서버 확인 중…'}
          {api === 'ok' && 'API 연결됨'}
          {api === 'down' && '서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요.'}
        </p>
      </main>
    </div>
  );
}
