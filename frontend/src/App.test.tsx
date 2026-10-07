import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { App } from './App.tsx';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('API가 응답하면 연결됨을 보여준다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }))),
    );
    render(<App />);

    expect(screen.getByText('to-do zone')).toBeTruthy();
    expect(await screen.findByText('API 연결됨')).toBeTruthy();
  });

  it('서버가 꺼져 있으면 한글 안내를 보여준다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    render(<App />);

    expect(await screen.findByText(/서버에 연결할 수 없어요/)).toBeTruthy();
  });
});
