import { useState } from 'react';
import { request } from '../api/client.ts';
import styles from './Login.module.css';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <main className={styles.login}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError('');
          try {
            await request('POST', '/api/auth/login', { password });
            setPassword('');
            onLogin();
          } catch (err) {
            setError(err instanceof Error ? err.message : '로그인하지 못했어요.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <small>YOUR PERSONAL SPACE</small>
        <h1>One card at a time.</h1>
        <p>로그인하고 오늘의 Card를 이어가세요.</p>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            maxLength={1024}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={busy || !password}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </main>
  );
}
