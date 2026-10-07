import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App.tsx';
import { card, installFakeApi } from './test/fakeApi.ts';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderApp() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

const column = (name: string) => within(screen.getByRole('region', { name }));
const heading = (name: string) => column(name).getByRole('heading', { level: 2 }).textContent;

// 지난 분기 완료 시각: 지금 날짜와 상관없이 항상 지난 분기가 되도록 1년 전
const LAST_YEAR = new Date(Date.now() - 366 * 24 * 3600 * 1000).toISOString();

const fixture = [
  card('자격증 시험 예약', 'todo', 0, { projectId: 'career', dueDate: '2026-10-14' }),
  card('읽을 책 고르기', 'todo', 1),
  card('앱 화면 연결', 'doing', 0),
  card('포트폴리오 정리', 'done', 0, { projectId: 'career' }),
  card('지난 분기에 끝낸 일', 'done', 1, { completedAt: LAST_YEAR }),
];

describe('Board ↔ 서버 연결 (step11-4)', () => {
  it('서버에서 Board를 불러오고, 지난 분기 Done은 보이지 않는다 (D-072, D-075)', async () => {
    installFakeApi(fixture);
    renderApp();

    expect(await screen.findByText('자격증 시험 예약')).toBeTruthy();
    expect(heading('Todo')).toBe('Todo 2');
    expect(heading('Doing')).toBe('Doing 1');
    expect(heading('Done')).toBe('Done 1');
    expect(screen.queryByText('지난 분기에 끝낸 일')).toBeNull();
  });

  it('서버가 꺼져 있으면 E4 안내와 Retry가 보인다', async () => {
    installFakeApi(fixture, { down: true });
    renderApp();

    expect(await screen.findByText(/서버에 연결할 수 없어요/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('+ New card → Enter: 화면에 바로 생기고 서버에 저장된다 (필터 없으면 Inbox)', async () => {
    const api = installFakeApi(fixture);
    renderApp();
    await screen.findByText('자격증 시험 예약');

    fireEvent.click(column('Todo').getByRole('button', { name: /New card/ }));
    const input = screen.getByRole('textbox', { name: '새 카드 제목' });
    fireEvent.change(input, { target: { value: '이력서 다듬기' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(heading('Todo')).toBe('Todo 3'));
    expect(column('Todo').getAllByRole('heading', { level: 3 })[0]!.textContent).toBe(
      '이력서 다듬기',
    );
    await waitFor(() => expect(api.cards()).toHaveLength(6));
    const post = api.calls.find((c) => c.method === 'POST' && c.path === '/api/cards');
    expect(post?.body).toMatchObject({
      title: '이력서 다듬기',
      status: 'todo',
      projectId: 'inbox',
    });
  });

  it('필터가 켜져 있으면 그 Project로 만든다 (D-018)', async () => {
    const api = installFakeApi(fixture);
    renderApp();
    await screen.findByText('자격증 시험 예약');

    const tags = within(screen.getByRole('navigation', { name: 'Projects' }));
    fireEvent.click(tags.getByRole('button', { name: /커리어/ }));
    expect(heading('Todo')).toBe('Todo 1');

    fireEvent.click(column('Todo').getByRole('button', { name: /New card/ }));
    const input = screen.getByRole('textbox', { name: '새 카드 제목' });
    fireEvent.change(input, { target: { value: '발표 자료 만들기' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() =>
      expect(api.calls.find((c) => c.method === 'POST')?.body).toMatchObject({
        projectId: 'career',
      }),
    );
  });

  it('한글 조합 중 Enter로는 카드가 생기지 않는다', async () => {
    const api = installFakeApi(fixture);
    renderApp();
    await screen.findByText('자격증 시험 예약');

    fireEvent.click(column('Todo').getByRole('button', { name: /New card/ }));
    const input = screen.getByRole('textbox', { name: '새 카드 제목' });
    fireEvent.change(input, { target: { value: '한글' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });

    expect(heading('Todo')).toBe('Todo 2');
    expect(api.calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('Done 열을 접으면 카드가 숨는다 (D-045)', async () => {
    installFakeApi(fixture);
    renderApp();
    await screen.findByText('자격증 시험 예약');

    fireEvent.click(screen.getByRole('button', { name: 'Done 열 접기' }));
    expect(column('Done').queryAllByRole('heading', { level: 3 })).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Done 열 펼치기' }));
  });
});
