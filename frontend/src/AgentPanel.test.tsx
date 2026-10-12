import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AgentPanel } from './components/AgentPanel.tsx';
import { areas, projects, card } from './test/fakeApi.ts';

const data = { areas, projects, cards: [card('Actual card', 'todo', 0)] };
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Agent UI preview', () => {
  it('keeps preview approval separate from actual Card writes and allows excluding changes', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    render(<AgentPanel open data={data} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /변경안 예시 체험/ }));
    const review = within(screen.getByRole('region', { name: '예시 변경안' }));
    fireEvent.click(review.getByLabelText('회의 자료 준비 변경 선택'));
    expect(review.getByText('2 / 3 선택')).toBeTruthy();
    fireEvent.click(review.getByRole('button', { name: 'DONE 예시 변경 적용' }));
    expect(screen.getByRole('status').textContent).toContain('2개');
    expect(screen.getByRole('status').textContent).toContain('실제 Card는 변경하지 않았어요');
    expect(fetch).not.toHaveBeenCalled();
    expect(data.cards[0]?.status).toBe('todo');
  });

  it('does not interpret arbitrary text or send Korean IME compositions', () => {
    render(<AgentPanel open data={data} onClose={() => {}} />);
    const input = screen.getByRole('textbox', { name: '에이전트에게 요청하기' });
    fireEvent.change(input, { target: { value: '새 카드 만들어줘' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(screen.queryByRole('log')).toBeNull();
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(screen.queryByRole('log')).toBeNull();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('log').textContent).toContain('아직 실행되지 않았어요');
    expect(screen.queryByRole('button', { name: 'DONE 예시 변경 적용' })).toBeNull();
  });

  it('disables approval for empty selection and preserves drafts when the panel closes', () => {
    const view = render(<AgentPanel open data={data} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /변경안 예시 체험/ }));
    screen.getAllByRole('checkbox').forEach((checkbox) => fireEvent.click(checkbox));
    expect(
      (screen.getByRole('button', { name: 'DONE 예시 변경 적용' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    view.rerender(<AgentPanel open={false} data={data} onClose={() => {}} />);
    view.rerender(<AgentPanel open data={data} onClose={() => {}} />);
    expect(screen.getByText('0 / 3 선택')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '새 대화' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }));
    expect(screen.getByRole('region', { name: '예시 변경안' })).toBeTruthy();
  });
});
