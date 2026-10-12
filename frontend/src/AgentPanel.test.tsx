import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { AgentPanel } from './components/AgentPanel.tsx';
import { areas, projects, card } from './test/fakeApi.ts';
import type { AgentReply } from '@todo-zone/shared';

const api = vi.hoisted(() => ({
  agentStatus: vi.fn(),
  chatWithAgent: vi.fn(),
  approveAgent: vi.fn(),
}));
vi.mock('./api/agent.ts', () => api);
const data = { areas, projects, cards: [card('Actual card', 'todo', 0)] };
function draft(): AgentReply {
  return {
    conversationId: crypto.randomUUID(),
    version: 1,
    reply: '두 변경안을 준비했어요.',
    clarification: null,
    expiresAt: Date.now() + 1800000,
    changes: ['회의 자료 준비', '다음 일정 정리'].map((title) => ({
      id: crypto.randomUUID(),
      kind: 'create',
      cardId: crypto.randomUUID(),
      before: null,
      after: {
        title,
        memo: '회의에서 검토할 자료',
        status: 'todo',
        dueDate: '2026-10-13',
        checklist: [],
        projectId: projects[0]!.id,
      },
      projectName: projects[0]!.name,
      projectUpdatedAt: projects[0]!.updatedAt,
    })),
  };
}
async function send(text = '내일까지 회의 자료 준비를 추가해줘') {
  const input = screen.getByRole('textbox', { name: '에이전트에게 요청하기' });
  await waitFor(() => expect((input as HTMLTextAreaElement).disabled).toBe(false));
  fireEvent.change(input, { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: '메시지 보내기' }));
}
beforeEach(() => {
  vi.clearAllMocks();
  api.agentStatus.mockResolvedValue({
    configured: true,
    model: 'test',
    message: '변경안을 확인하고 적용 버튼을 누르면 저장해요.',
  });
  api.chatWithAgent.mockResolvedValue(draft());
  api.approveAgent.mockResolvedValue({
    appliedCount: 1,
    cardIds: ['saved'],
    appliedAt: new Date().toISOString(),
  });
});
afterEach(cleanup);

describe('Agent Card management', () => {
  it('shows actual before/after details and only saves selected, edited changes on explicit approval', async () => {
    const mixed = draft();
    mixed.changes[1] = {
      ...mixed.changes[1]!,
      kind: 'update',
      cardId: data.cards[0]!.id,
      before: data.cards[0]!,
    };
    api.chatWithAgent.mockResolvedValue(mixed);
    const onApplied = vi.fn().mockResolvedValue(undefined);
    render(<AgentPanel open data={data} onClose={() => {}} onApplied={onApplied} />);
    await send();
    const review = within(await screen.findByRole('region', { name: '변경안' }));
    expect(review.getAllByText('2026-10-13')).toHaveLength(2);
    expect(review.getAllByText('회의에서 검토할 자료')).toHaveLength(2);
    expect(api.approveAgent).not.toHaveBeenCalled();
    expect(review.getByRole('button', { name: '전체 적용하기' })).toBeTruthy();
    expect(review.getByText('선택한 2개 변경사항을 적용해요.')).toBeTruthy();
    fireEvent.click(review.getByLabelText('회의 자료 준비 변경 선택'));
    expect(review.getByRole('button', { name: '변경 적용하기' })).toBeTruthy();
    fireEvent.click(review.getByLabelText('다음 일정 정리 변경 선택'));
    expect(
      (review.getByRole('button', { name: '변경 적용하기' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(review.getByText('적용할 변경사항을 선택해 주세요.')).toBeTruthy();
    fireEvent.click(review.getByLabelText('회의 자료 준비 변경 선택'));
    fireEvent.click(review.getByRole('button', { name: '회의 자료 준비 제목 수정' }));
    fireEvent.change(review.getByRole('textbox', { name: '변경안 제목' }), {
      target: { value: '검토한 제목' },
    });
    const done = review.getByRole('button', { name: '등록하기' });
    fireEvent.click(done);
    fireEvent.click(done);
    await screen.findByText('1개 변경을 저장했어요.');
    expect(api.approveAgent).toHaveBeenCalledTimes(1);
    expect(api.approveAgent.mock.calls[0]![0].changes).toEqual([
      { id: expect.any(String), title: '검토한 제목' },
    ]);
    expect(onApplied).toHaveBeenCalledTimes(1);
    expect(data.cards[0]?.status).toBe('todo');
  });

  it('preserves Korean IME composition and displays clarifications without an approval action', async () => {
    api.chatWithAgent.mockResolvedValue({
      ...draft(),
      changes: [],
      clarification: '어느 Project의 Card인가요?',
    });
    render(<AgentPanel open data={data} onClose={() => {}} />);
    const input = screen.getByRole('textbox', { name: '에이전트에게 요청하기' });
    await waitFor(() => expect((input as HTMLTextAreaElement).disabled).toBe(false));
    fireEvent.change(input, { target: { value: '그 카드 완료해줘' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(api.chatWithAgent).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Enter' });
    await screen.findByText('어느 Project의 Card인가요?');
    expect(screen.queryByRole('button', { name: '등록하기' })).toBeNull();
  });

  it('shows a failed save as an error, preserving the reviewed request for safe retry', async () => {
    api.approveAgent.mockRejectedValueOnce(
      new Error('다른 창에서 변경됐어요. 변경안을 다시 만들어 주세요.'),
    );
    render(<AgentPanel open data={data} onClose={() => {}} />);
    await send();
    fireEvent.click(await screen.findByRole('button', { name: '등록하기' }));
    expect((await screen.findByRole('alert')).textContent).toContain('다른 창');
    expect(screen.queryByText('All set.')).toBeNull();
    expect(screen.getByRole('region', { name: '변경안' })).toBeTruthy();
  });

  it('carries title edits and exclusions into a follow-up, clearing stale approval during generation', async () => {
    const view = render(<AgentPanel open data={data} onClose={() => {}} />);
    await send();
    await screen.findByRole('region', { name: '변경안' });
    fireEvent.click(screen.getByLabelText('다음 일정 정리 변경 선택'));
    view.rerender(<AgentPanel open={false} data={data} onClose={() => {}} />);
    view.rerender(<AgentPanel open data={data} onClose={() => {}} />);
    expect(screen.getByText('1 / 2 선택')).toBeTruthy();
    api.chatWithAgent.mockImplementationOnce(() => new Promise(() => {}));
    await send('마감일만 모레로 바꿔줘');
    expect(
      api.chatWithAgent.mock.calls[1]![0].draft.map((item: { selected: boolean }) => item.selected),
    ).toEqual([true, false]);
    expect(screen.queryByRole('button', { name: '등록하기' })).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('변경안을 준비');
  });

  it('disables submission with an actionable explanation when AI authentication is missing', async () => {
    api.agentStatus.mockResolvedValue({
      configured: false,
      model: '',
      message: 'AI 연결 설정이 필요해요.',
    });
    render(<AgentPanel open data={data} onClose={() => {}} />);
    await screen.findByText('AI 연결 설정이 필요해요.');
    expect(
      (screen.getByRole('button', { name: '메시지 보내기' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(api.chatWithAgent).not.toHaveBeenCalled();
  });
});
