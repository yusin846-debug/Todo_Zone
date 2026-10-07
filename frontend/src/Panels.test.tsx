import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App.tsx';
import { formatKoreanDate, toDateKey } from './lib/dates.ts';
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
const panel = (name: string) => within(screen.getByRole('dialog', { name }));

const fixture = [
  card('자격증 시험 예약', 'todo', 0, { projectId: 'career', dueDate: '2026-10-14', memo: '메모' }),
  card('읽을 책 고르기', 'todo', 1),
  card('앱 화면 연결', 'doing', 0),
];

async function openCard(title: string) {
  fireEvent.click(await screen.findByRole('button', { name: new RegExp(`: ${title}$`) }));
  return panel('Card');
}

describe('Card 상세 패널 (S2, F3·F4·F7)', () => {
  it('카드를 누르면 지금 값이 채워진 패널이 열린다', async () => {
    installFakeApi(fixture);
    renderApp();
    const p = await openCard('자격증 시험 예약');

    expect((p.getByRole('textbox', { name: /Title/ }) as HTMLTextAreaElement).value).toBe(
      '자격증 시험 예약',
    );
    expect((p.getByRole('textbox', { name: /Memo/ }) as HTMLTextAreaElement).value).toBe('메모');
    expect(p.getByRole('button', { name: 'Due date: 10월 14일 (수)' })).toBeTruthy();
    expect(p.getByRole('button', { name: 'Project: 커리어' })).toBeTruthy();
    expect(p.getByRole('radio', { name: 'Todo' }).getAttribute('aria-checked')).toBe('true');
  });

  it('Enter로도 열린다 (Space는 드래그용)', async () => {
    installFakeApi(fixture);
    renderApp();
    const target = await screen.findByRole('button', { name: /: 읽을 책 고르기$/ });
    fireEvent.keyDown(target, { key: 'Enter' });
    expect(screen.getByRole('dialog', { name: 'Card' })).toBeTruthy();
  });

  it('바꾼 필드만 PATCH로 저장하고 패널이 닫힌다', async () => {
    const api = installFakeApi(fixture);
    renderApp();
    const p = await openCard('읽을 책 고르기');

    fireEvent.change(p.getByRole('textbox', { name: /Title/ }), {
      target: { value: '  읽을 책 2권 고르기 ' },
    });
    fireEvent.change(p.getByRole('textbox', { name: /Memo/ }), {
      target: { value: '소설 1, 실용서 1' },
    });
    fireEvent.click(p.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Card' })).toBeNull());
    await waitFor(() =>
      expect(api.calls.find((c) => c.method === 'PATCH')?.body).toEqual({
        title: '읽을 책 2권 고르기',
        memo: '소설 1, 실용서 1',
      }),
    );
    expect(await screen.findByText('읽을 책 2권 고르기')).toBeTruthy();
  });

  it('제목을 비우면 Save가 꺼지고 안내가 보인다 (V1)', async () => {
    installFakeApi(fixture);
    renderApp();
    const p = await openCard('읽을 책 고르기');

    fireEvent.change(p.getByRole('textbox', { name: /Title/ }), { target: { value: '   ' } });
    expect((p.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(true);
    expect(p.getByText('제목을 입력해 주세요.')).toBeTruthy();
  });

  it('마감일을 지우면 dueDate: null을 보낸다', async () => {
    const api = installFakeApi(fixture);
    renderApp();
    const p = await openCard('자격증 시험 예약');

    fireEvent.click(p.getByRole('button', { name: /^Due date/ }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: '날짜 고르기' })).getByRole('button', {
        name: '지우기',
      }),
    );
    fireEvent.click(p.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(api.calls.find((c) => c.method === 'PATCH')?.body).toEqual({ dueDate: null }),
    );
  });

  it('Status를 Done으로 바꾸면 Done 열 맨 위로 간다 (모바일 이동, F4)', async () => {
    const api = installFakeApi(fixture);
    renderApp();
    const p = await openCard('읽을 책 고르기');

    fireEvent.click(p.getByRole('radio', { name: 'Done' }));
    fireEvent.click(p.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(heading('Done')).toBe('Done 1'));
    expect(api.calls.find((c) => c.path.endsWith('/move'))?.body).toEqual({
      status: 'done',
      afterId: null,
    });
  });

  it('Delete는 확인 창(D1)을 거치고, Cancel이 기본 포커스다', async () => {
    const api = installFakeApi(fixture);
    renderApp();
    const p = await openCard('읽을 책 고르기');

    fireEvent.click(p.getByRole('button', { name: 'Delete' }));
    const confirm = within(screen.getByRole('alertdialog'));
    expect(confirm.getByText('이 카드를 삭제할까요? 삭제하면 되돌릴 수 없어요.')).toBeTruthy();
    expect(document.activeElement).toBe(confirm.getByRole('button', { name: 'Cancel' }));

    fireEvent.click(confirm.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(heading('Todo')).toBe('Todo 1'));
    expect(api.calls.some((c) => c.method === 'DELETE')).toBe(true);
  });

  it('저장하지 않고 닫으면 확인 창(D2)이 뜬다', async () => {
    installFakeApi(fixture);
    renderApp();
    const p = await openCard('읽을 책 고르기');

    fireEvent.change(p.getByRole('textbox', { name: /Memo/ }), { target: { value: '바뀜' } });
    fireEvent.click(p.getByRole('button', { name: '패널 닫기' }));
    expect(screen.getByText('저장하지 않은 변경이 있어요. 닫을까요?')).toBeTruthy();

    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Card' })).toBeNull());
  });
});

describe('직접 만든 선택 칸 (D-080)', () => {
  it('Due date: 빠른 선택 "내일"과 달력의 날짜로 고른다', async () => {
    const api = installFakeApi(fixture);
    renderApp();
    const p = await openCard('읽을 책 고르기');

    fireEvent.click(p.getByRole('button', { name: 'Due date: 날짜 없음' }));
    const picker = within(screen.getByRole('dialog', { name: '날짜 고르기' }));
    // 달력은 오늘이 있는 달로 열린다: 그 달 15일을 고른다
    const target = `${toDateKey(new Date()).slice(0, 8)}15`;
    fireEvent.click(picker.getByRole('button', { name: formatKoreanDate(target) }));
    expect(p.getByRole('button', { name: `Due date: ${formatKoreanDate(target)}` })).toBeTruthy();

    fireEvent.click(p.getByRole('button', { name: /^Due date/ }));
    fireEvent.click(
      within(screen.getByRole('dialog', { name: '날짜 고르기' })).getByRole('button', {
        name: '내일',
      }),
    );
    fireEvent.click(p.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(api.calls.find((c) => c.method === 'PATCH')?.body).toHaveProperty('dueDate'),
    );
  });

  it('Project: 목록을 열어 고르면 트리거에 반영된다', async () => {
    installFakeApi(fixture);
    renderApp();
    const p = await openCard('읽을 책 고르기');

    fireEvent.click(p.getByRole('button', { name: 'Project: Inbox' }));
    fireEvent.click(screen.getByRole('option', { name: /채운/ }));
    expect(p.getByRole('button', { name: 'Project: 채운' })).toBeTruthy();
  });

  it('Status: 방향키로도 바뀐다', async () => {
    installFakeApi(fixture);
    renderApp();
    const p = await openCard('읽을 책 고르기');

    fireEvent.keyDown(p.getByRole('radio', { name: 'Todo' }), { key: 'ArrowRight' });
    expect(p.getByRole('radio', { name: 'Doing' }).getAttribute('aria-checked')).toBe('true');
  });
});

describe('Projects 관리 (S3, F8)', () => {
  async function openProjects() {
    await screen.findByText('읽을 책 고르기');
    fireEvent.click(screen.getByRole('button', { name: /New project/ }));
    return panel('Projects');
  }

  it('Area 묶음 안에서 "Add project"로 그 Area의 Project를 만든다 (D-084)', async () => {
    const api = installFakeApi(fixture);
    renderApp();
    const p = await openProjects();

    fireEvent.click(p.getByRole('button', { name: 'Ventures에 Project 추가' }));
    const input = p.getByRole('textbox', { name: 'Ventures에 새 Project' });
    fireEvent.change(input, { target: { value: '샛별밤' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() =>
      expect(api.projects().find((x) => x.name === '샛별밤')?.areaId).toBe('a-ventures'),
    );
    const tags = within(screen.getByRole('navigation', { name: 'Projects' }));
    expect(await tags.findByRole('button', { name: /샛별밤/ })).toBeTruthy();
  });

  it('이름이 겹치면 서버의 한글 문구를 보여 준다 (V2)', async () => {
    installFakeApi(fixture);
    renderApp();
    const p = await openProjects();

    fireEvent.click(p.getByRole('button', { name: 'Career에 Project 추가' }));
    const input = p.getByRole('textbox', { name: 'Career에 새 Project' });
    fireEvent.change(input, { target: { value: '커리어' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await p.findByText('이미 같은 이름의 Project가 있어요.')).toBeTruthy();
  });

  it('Inbox는 이름·색·아이콘을 바꿀 수 없고 삭제 버튼이 없다', async () => {
    installFakeApi(fixture);
    renderApp();
    const p = await openProjects();

    expect(
      (p.getByRole('button', { name: 'Inbox 이름 바꾸기' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (p.getByRole('button', { name: 'Inbox 아이콘 바꾸기' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(p.queryByRole('button', { name: 'Inbox 삭제' })).toBeNull();
  });

  it('아이콘을 김밥으로 바꾼다', async () => {
    const api = installFakeApi(fixture);
    renderApp();
    const p = await openProjects();

    fireEvent.click(p.getByRole('button', { name: '채운 아이콘 바꾸기' }));
    fireEvent.click(p.getByRole('button', { name: 'gimbap' }));
    await waitFor(() => expect(api.projects().find((x) => x.name === '채운')?.icon).toBe('gimbap'));
  });

  it('삭제 확인 창(D3)에 옮겨질 카드 수가 보이고, 카드는 Inbox로 간다', async () => {
    const api = installFakeApi(fixture);
    renderApp();
    const p = await openProjects();

    fireEvent.click(p.getByRole('button', { name: '커리어 삭제' }));
    expect(
      screen.getByText("'커리어' Project를 삭제할까요? 카드 1장은 Inbox로 옮겨져요."),
    ).toBeTruthy();
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }),
    );

    await waitFor(() => expect(api.projects().some((x) => x.name === '커리어')).toBe(false));
    expect(api.cards().every((c) => c.projectId === 'inbox')).toBe(true);
  });

  it('Project를 다른 Area로 옮기면 카드 색이 그 Area 색이 된다 (D-086)', async () => {
    const api = installFakeApi(fixture);
    renderApp();
    const p = await openProjects();

    fireEvent.click(p.getByRole('button', { name: '커리어 Area 옮기기' }));
    fireEvent.click(
      within(p.getByRole('group', { name: 'Area 고르기' })).getByRole('button', {
        name: /Ventures/,
      }),
    );
    await waitFor(() =>
      expect(api.projects().find((x) => x.id === 'career')?.areaId).toBe('a-ventures'),
    );
    const cardEl = await screen.findByRole('button', { name: /: 자격증 시험 예약$/ });
    await waitFor(() => expect(cardEl.getAttribute('data-color')).toBe('salmon'));
  });

  it('새 Area를 만들고, Area를 지우면 확인 창에 옮겨질 Project 수가 보인다', async () => {
    const api = installFakeApi(fixture);
    renderApp();
    const p = await openProjects();

    const input = p.getByRole('textbox', { name: '새 Area 이름' });
    fireEvent.change(input, { target: { value: 'Family' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(api.areas().map((a) => a.name)).toContain('Family'));

    fireEvent.click(p.getByRole('button', { name: 'Career Area 삭제' }));
    expect(
      screen.getByText(
        "'Career' Area를 삭제할까요? Project 1개는 Unsorted로 옮겨져요. 카드는 그대로예요.",
      ),
    ).toBeTruthy();
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }),
    );
    await waitFor(() => expect(api.projects().find((x) => x.id === 'career')?.areaId).toBeNull());
  });
});
