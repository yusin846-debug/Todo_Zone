import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App.tsx';
import { quarterKey } from './lib/quarter.ts';
import { quarterLabel } from './lib/review.ts';
import { card, installFakeApi } from './test/fakeApi.ts';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.location.hash = '';
});

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

// 지난 분기가 항상 존재하도록 1년 전 완료
const lastYear = new Date(Date.now() - 366 * 24 * 3600 * 1000);
const LAST = lastYear.toISOString();

const fixture = [
  card('남은 일', 'todo', 0),
  card('이번 분기 1', 'done', 0, { projectId: 'career' }),
  card('이번 분기 2', 'done', 1, { projectId: 'career' }),
  card('이번 분기 3', 'done', 2, { projectId: 'chaeun' }),
  card('작년에 끝낸 일', 'done', 3, { projectId: 'chaeun', completedAt: LAST }),
];

async function openReview() {
  await screen.findByText('남은 일');
  fireEvent.click(screen.getByRole('radio', { name: 'Review' }));
}

describe('Quarterly Review (S5, F10·F11)', () => {
  it('헤더의 Review로 들어가고 주소는 #review다 (D-081)', async () => {
    installFakeApi(fixture);
    renderApp();
    await openReview();

    expect(window.location.hash).toBe('#review');
    expect(await screen.findByText('This quarter.')).toBeTruthy();
  });

  it('#review로 열면 바로 Review 화면이다 (새로고침 유지)', async () => {
    installFakeApi(fixture);
    window.location.hash = '#review';
    renderApp();
    expect(await screen.findByText('This quarter.')).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Review' }).getAttribute('aria-checked')).toBe('true');
  });

  it('이번 분기 완료 수와 Project별 묶음을 보여 준다', async () => {
    installFakeApi(fixture);
    renderApp();
    await openReview();

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('3 cards done.'),
    );
    const career = within(screen.getByRole('region', { name: '커리어 완료 목록' }));
    expect(career.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText('작년에 끝낸 일')).toBeNull();
    // 이번 분기 카드에는 Reopen이 없다 (Board에서 옮긴다)
    expect(screen.queryByRole('button', { name: /다시 열기/ })).toBeNull();
  });

  it('지난 분기로 가면 그 분기 카드가 보이고, Reopen하면 Todo 맨 위로 간다 (D-073)', async () => {
    const api = installFakeApi(fixture);
    renderApp();
    await openReview();

    fireEvent.click(
      await screen.findByRole('button', { name: quarterLabel(quarterKey(lastYear)) }),
    );
    expect(await screen.findByText('작년에 끝낸 일')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '작년에 끝낸 일 다시 열기' }));
    await waitFor(() =>
      expect(api.calls.find((c) => c.path.endsWith('/move'))?.body).toEqual({
        status: 'todo',
        afterId: null,
      }),
    );
    await waitFor(() => expect(screen.queryByText('작년에 끝낸 일')).toBeNull());
  });

  it('끝낸 카드가 없는 분기는 안내 문구를 보여 준다', async () => {
    installFakeApi([card('남은 일', 'todo', 0)]);
    renderApp();
    await openReview();
    expect(await screen.findByText('이 분기에는 끝낸 카드가 없어요.')).toBeTruthy();
  });
});
