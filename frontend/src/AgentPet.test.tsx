import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgentPet } from './components/AgentPet.tsx';

function loadAtlas(container: HTMLElement) {
  const loader = container.querySelector('img');
  if (!loader) throw new Error('Missing sprite loader');
  fireEvent.load(loader);
}
function sprite(container: HTMLElement) {
  return container.querySelector<HTMLElement>('[data-action]')!;
}
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Agent pet frame playback', () => {
  it('waits for the atlas, advances drawn poses, and cancels its timer when removed', () => {
    vi.useFakeTimers();
    const { container, unmount } = render(<AgentPet />);
    act(() => vi.advanceTimersByTime(2500));
    expect(sprite(container).style.backgroundPosition).toBe('0% 0%');
    loadAtlas(container);
    act(() => vi.advanceTimersByTime(2400));
    expect(sprite(container).style.backgroundPosition).not.toBe('0% 0%');
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('plays a greeting once, returns to idle, and allows another greeting', () => {
    vi.useFakeTimers();
    const { container } = render(<AgentPet interactive />);
    fireEvent.click(screen.getByRole('button', { name: '캐릭터 인사하기' }));
    loadAtlas(container);
    expect(sprite(container).dataset.action).toBe('wave');
    act(() => vi.advanceTimersByTime(1200));
    expect(sprite(container).dataset.action).toBe('idle');
    fireEvent.click(screen.getByRole('button', { name: '캐릭터 인사하기' }));
    expect(sprite(container).dataset.action).toBe('wave');
  });

  it('interrupts a greeting for a new mood and never replays the stale greeting', () => {
    vi.useFakeTimers();
    const view = render(<AgentPet interactive />);
    fireEvent.click(screen.getByRole('button', { name: '캐릭터 인사하기' }));
    loadAtlas(view.container);
    view.rerender(<AgentPet interactive mood="listening" />);
    expect(sprite(view.container).dataset.action).toBe('listen');
    view.rerender(<AgentPet interactive />);
    expect(sprite(view.container).dataset.action).toBe('idle');
    view.rerender(<AgentPet interactive mood="happy" />);
    loadAtlas(view.container);
    act(() => vi.advanceTimersByTime(1300));
    expect(sprite(view.container).dataset.action).toBe('idle');
  });

  it('shows a still pose while paused and falls back if the atlas fails to load', () => {
    vi.useFakeTimers();
    const view = render(<AgentPet paused mood="happy" />);
    loadAtlas(view.container);
    act(() => vi.advanceTimersByTime(10000));
    expect(sprite(view.container).style.backgroundPosition).toBe('0% 0%');
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.error(view.container.querySelector('img')!);
    expect(view.container.querySelector('img[src="/agent/zone-pet.png"]')).toBeTruthy();
  });
});
