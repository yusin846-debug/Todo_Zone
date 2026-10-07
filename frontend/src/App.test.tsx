import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from './App.tsx';

afterEach(cleanup);

function column(name: string) {
  return within(screen.getByRole('region', { name }));
}

describe('Board (step11-2, 가짜 데이터)', () => {
  it('세 Status 열과 카드 수를 보여준다', () => {
    render(<App />);
    expect(column('Todo').getByRole('heading', { level: 2 }).textContent).toBe('Todo 7');
    expect(column('Doing').getByRole('heading', { level: 2 }).textContent).toBe('Doing 3');
    expect(column('Done').getByRole('heading', { level: 2 }).textContent).toBe('Done 5');
  });

  it('Project 태그를 누르면 그 Project 카드만 보이고, 다시 누르면 해제된다 (D-033)', () => {
    render(<App />);
    const tags = within(screen.getByRole('navigation', { name: 'Projects' }));
    const school = tags.getByRole('button', { name: /학교/ });

    fireEvent.click(school);
    expect(school.getAttribute('aria-pressed')).toBe('true');
    expect(column('Todo').getByRole('heading', { level: 2 }).textContent).toBe('Todo 2');

    fireEvent.click(school);
    expect(column('Todo').getByRole('heading', { level: 2 }).textContent).toBe('Todo 7');
  });

  it('+ New card → 제목 입력 → Enter로 열 맨 위에 카드가 생긴다 (F2)', () => {
    render(<App />);
    fireEvent.click(column('Todo').getByRole('button', { name: /New card/ }));
    const input = screen.getByRole('textbox', { name: '새 카드 제목' });

    fireEvent.change(input, { target: { value: '  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(column('Todo').getByRole('heading', { level: 2 }).textContent).toBe('Todo 7');

    fireEvent.change(input, { target: { value: '테스트 카드' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(column('Todo').getByRole('heading', { level: 2 }).textContent).toBe('Todo 8');
    expect(column('Todo').getAllByRole('heading', { level: 3 })[0]!.textContent).toBe(
      '테스트 카드',
    );
  });

  it('한글 조합 중 Enter로는 카드가 생기지 않는다', () => {
    render(<App />);
    fireEvent.click(column('Todo').getByRole('button', { name: /New card/ }));
    const input = screen.getByRole('textbox', { name: '새 카드 제목' });

    fireEvent.change(input, { target: { value: '한글' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(column('Todo').getByRole('heading', { level: 2 }).textContent).toBe('Todo 7');
  });

  it('Done 열을 접으면 카드가 숨는다 (D-045)', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Done 열 접기' }));
    expect(column('Done').queryAllByRole('heading', { level: 3 })).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Done 열 펼치기' }));
  });
});
