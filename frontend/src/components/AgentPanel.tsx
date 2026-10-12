import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ArrowUp,
  Check,
  CheckCheck,
  CornerDownLeft,
  FilePlus2,
  Layers3,
  Pencil,
  Pause,
  Play,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import type { AgentChange, AgentConnection } from '@todo-zone/shared';
import { agentStatus, chatWithAgent, approveAgent } from '../api/agent.ts';
import { agentDiff } from '../lib/agent-diff.ts';
import type { BoardData } from '../api/board.ts';
import { AgentPet } from './AgentPet.tsx';
import { settle } from '../lib/motion.ts';
import styles from './AgentPanel.module.css';

type Change = AgentChange & { title: string; selected: boolean };
type Message = { id: number; role: 'user' | 'agent'; text: string };
const LABELS = { create: 'NEW', update: 'UPDATE', complete: 'COMPLETE' };
const ICONS = { create: FilePlus2, update: Pencil, complete: CheckCheck };

export function AgentToggle({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-expanded={open}
      aria-controls="zone-agent"
      onClick={onClick}
    >
      <AgentPet size="tiny" paused />
      <span>Agent</span>
      <span className={styles.toggleTrack} data-on={open} aria-hidden="true">
        <span />
      </span>
    </button>
  );
}

/** Read and propose through chat. Only explicit approval can call the approval endpoint. */
export function AgentPanel({
  open,
  data,
  onClose,
  onApplied,
}: {
  open: boolean;
  data: BoardData;
  onClose: () => void;
  onApplied?: () => Promise<unknown>;
}) {
  const [connection, setConnection] = useState<AgentConnection | null>(null);
  const [busy, setBusy] = useState<'thinking' | 'saving' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID());
  const [version, setVersion] = useState(0);
  const [expiresAt, setExpiresAt] = useState(0);
  const pending = useRef(false);
  const requestId = useRef(0);
  const [motionPaused, setMotionPaused] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [applied, setApplied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const messageId = useRef(0);
  const reducedMotion = useReducedMotion();
  const selectedChanges = changes.filter((change) => change.selected);
  const selected = selectedChanges.length;
  const hasNew = selectedChanges.some((change) => change.kind === 'create');
  const hasExisting = selectedChanges.some((change) => change.kind !== 'create');
  const applyLabel = hasNew ? (hasExisting ? '전체 적용하기' : '등록하기') : '변경 적용하기';
  const hasConversation = messages.length > 0;

  useEffect(
    () => () => {
      requestId.current += 1;
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    let active = true;
    agentStatus()
      .then((value) => {
        if (active) setConnection(value);
      })
      .catch(() => {
        if (active)
          setConnection({
            configured: false,
            model: '',
            message: '연결 상태를 확인하지 못했어요. 패널을 다시 열어 주세요.',
          });
      });
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    composer.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (open && connection?.configured) composer.current?.focus();
  }, [open, connection?.configured]);

  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages, applied, notice, error, busy, open]);

  function append(role: Message['role'], text: string) {
    setMessages((current) => [...current, { id: ++messageId.current, role, text }]);
  }

  async function submit() {
    const text = input.trim();
    if (!text || pending.current || !connection?.configured) return;
    const id = ++requestId.current;
    pending.current = true;
    setBusy('thinking');
    setError(null);
    setNotice(null);
    setApplied(false);
    setEditing(null);
    const draft = changes
      .filter(() => !applied)
      .map(({ id, title, selected }) => ({ id, title, selected }));
    setChanges([]);
    append('user', text);
    setInput('');
    try {
      const result = await chatWithAgent({
        conversationId,
        expectedVersion: version,
        message: text,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Seoul',
        draft,
      });
      if (id !== requestId.current) return;
      setVersion(result.version);
      setExpiresAt(result.expiresAt);
      setChanges(
        result.changes.map((change) => ({ ...change, title: change.after.title, selected: true })),
      );
      append('agent', result.clarification || result.reply);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(
        err instanceof Error ? err.message : '변경안을 만들지 못했어요. 다시 요청해 주세요.',
      );
      setInput(text);
    } finally {
      if (id === requestId.current) {
        pending.current = false;
        setBusy(null);
        composer.current?.focus();
      }
    }
  }

  async function applyChanges() {
    if (pending.current || applied || !selected) return;
    if (Date.now() >= expiresAt) {
      setError('변경안이 만료됐어요. 새 대화에서 다시 요청해 주세요.');
      return;
    }
    pending.current = true;
    setBusy('saving');
    setError(null);
    try {
      const result = await approveAgent({
        conversationId,
        version,
        changes: changes
          .filter((change) => change.selected)
          .map(({ id, title }) => ({ id, title })),
      });
      setApplied(true);
      setEditing(null);
      setNotice(`${result.appliedCount}개 변경을 저장했어요.`);
      try {
        await onApplied?.();
      } catch {
        setNotice(
          `${result.appliedCount}개 변경을 저장했어요. 최신 Board는 새로고침해서 확인해 주세요.`,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '저장 결과를 확인하지 못했어요. 적용 버튼을 다시 눌러 확인할 수 있어요.',
      );
    } finally {
      pending.current = false;
      setBusy(null);
    }
  }

  function reset() {
    if (pending.current) return;
    requestId.current += 1;
    setConversationId(crypto.randomUUID());
    setVersion(0);
    setExpiresAt(0);
    setInput('');
    setMessages([]);
    setChanges([]);
    setApplied(false);
    setNotice(null);
    setError(null);
    setEditing(null);
    setConfirmReset(false);
    composer.current?.focus();
  }

  function trapFocus(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
    if (event.key !== 'Tab') return;
    const items = panel.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), textarea:not(:disabled), input:not(:disabled), [tabindex="0"]',
    );
    if (!items?.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            id="zone-agent"
            ref={panel}
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="zone-agent-title"
            initial={{ opacity: 0, x: reducedMotion ? 0 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: reducedMotion ? 0 : 24 }}
            transition={reducedMotion ? { duration: 0 } : settle}
            onKeyDown={trapFocus}
          >
            <header className={styles.header}>
              <div className={styles.identity}>
                <AgentPet
                  mood={
                    busy ? 'listening' : applied ? 'happy' : input.trim() ? 'listening' : 'idle'
                  }
                  paused={motionPaused || !!reducedMotion}
                  interactive
                />
                <div>
                  <h2 id="zone-agent-title">Zone agent</h2>
                  <span className={styles.caption}>A little help, a clear head.</span>
                </div>
              </div>
              <div className={styles.headActions}>
                {!reducedMotion && (
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={motionPaused ? '캐릭터 모션 켜기' : '캐릭터 모션 끄기'}
                    aria-pressed={motionPaused}
                    onClick={() => setMotionPaused((value) => !value)}
                  >
                    {motionPaused ? <Play size={15} /> : <Pause size={15} />}
                  </button>
                )}
                {hasConversation && (
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label="새 대화"
                    disabled={!!busy}
                    onClick={() => setConfirmReset(true)}
                  >
                    <RotateCcw size={17} />
                  </button>
                )}
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label="에이전트 닫기"
                  onClick={onClose}
                >
                  <X size={20} />
                </button>
              </div>
            </header>

            <div className={styles.context}>
              <span>
                <Layers3 size={13} aria-hidden="true" /> Your board{' '}
                <span className={styles.contextCount}>
                  {data.cards.filter((card) => card.status !== 'done').length} open
                </span>
              </span>
              <span className={styles.previewLabel}>
                {busy === 'thinking' ? 'THINKING' : busy === 'saving' ? 'SAVING' : 'YOUR ASSISTANT'}
              </span>
            </div>

            <div className={styles.scroll} ref={scroll}>
              {confirmReset && (
                <div className={styles.resetPrompt}>
                  <p>현재 대화와 미적용 변경안을 비울까요?</p>
                  <div>
                    <button type="button" onClick={() => setConfirmReset(false)}>
                      Keep
                    </button>
                    <button type="button" onClick={reset}>
                      New chat
                    </button>
                  </div>
                </div>
              )}

              {!hasConversation ? (
                <div className={styles.welcome}>
                  <div className={styles.petStage}>
                    <AgentPet
                      size="hero"
                      mood={input.trim() ? 'listening' : 'idle'}
                      paused={motionPaused || !!reducedMotion}
                      interactive
                    />
                  </div>
                  <span className={styles.eyebrow}>FROM WORDS TO CARDS</span>
                  <h3>
                    Less typing.
                    <br />
                    <em>More doing.</em>
                  </h3>
                  <p>
                    새로 생긴 일도, 바뀐 일정도.
                    <br />
                    편하게 이야기하고 한 번에 정리해요.
                  </p>
                  <div className={styles.starters}>
                    <button
                      type="button"
                      onClick={() => {
                        setInput('내일까지 회의 자료 준비를 추가해줘');
                        composer.current?.focus();
                      }}
                    >
                      <span className={styles.starterIcon} data-kind="create">
                        <Plus size={17} />
                      </span>
                      <span>
                        <b>Add a card</b>
                        <small>새로 생긴 일을 등록해요</small>
                      </span>
                      <ArrowUp size={15} className={styles.starterArrow} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInput('디자인 검토 마감일을 내일로 바꿔줘');
                        composer.current?.focus();
                      }}
                    >
                      <span className={styles.starterIcon} data-kind="update">
                        <Pencil size={16} />
                      </span>
                      <span>
                        <b>Make a change</b>
                        <small>일정과 내용을 바꿔요</small>
                      </span>
                      <ArrowUp size={15} className={styles.starterArrow} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInput('자료 조사는 끝났어. 완료 처리해줘');
                        composer.current?.focus();
                      }}
                    >
                      <span className={styles.starterIcon} data-kind="complete">
                        <CheckCheck size={17} />
                      </span>
                      <span>
                        <b>Wrap it up</b>
                        <small>끝낸 일을 완료로 옮겨요</small>
                      </span>
                      <ArrowUp size={15} className={styles.starterArrow} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={styles.messages}
                    role="log"
                    aria-label="에이전트 대화"
                    aria-live="polite"
                    aria-relevant="additions"
                  >
                    {messages.map((message) => (
                      <div key={message.id} className={styles.message} data-role={message.role}>
                        {message.role === 'agent' && <AgentPet size="tiny" paused />}
                        <div>
                          <span className={styles.speaker}>
                            {message.role === 'user' ? 'YOU' : 'ZONE AGENT'}
                          </span>
                          <p>{message.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {changes.length > 0 && (
                <section className={styles.review} aria-label="변경안">
                  <div className={styles.reviewHead}>
                    <span>REVIEW CHANGES</span>
                    <span>{applied ? '저장 완료' : `${selected} / ${changes.length} 선택`}</span>
                  </div>
                  <p className={styles.sampleNote}>
                    내용을 검토하고 적용 버튼을 누르면 선택한 변경만 저장해요.
                  </p>
                  <div className={styles.changeList}>
                    {changes.map((change) => {
                      const Icon = ICONS[change.kind];
                      return (
                        <article
                          key={change.id}
                          className={styles.change}
                          data-kind={change.kind}
                          data-selected={change.selected}
                          data-applied={applied}
                        >
                          <div className={styles.changeHead}>
                            <label className={styles.selection}>
                              <input
                                type="checkbox"
                                checked={change.selected}
                                disabled={applied || !!busy}
                                aria-label={`${change.title} 변경 선택`}
                                onChange={() =>
                                  setChanges((current) =>
                                    current.map((item) =>
                                      item.id === change.id
                                        ? { ...item, selected: !item.selected }
                                        : item,
                                    ),
                                  )
                                }
                              />
                              <Icon size={13} aria-hidden="true" />
                              <span>{LABELS[change.kind]}</span>
                            </label>
                            {!applied && (
                              <button
                                type="button"
                                className={styles.editButton}
                                aria-label={`${change.title} 제목 수정`}
                                disabled={!!busy}
                                onClick={() => setEditing(editing === change.id ? null : change.id)}
                              >
                                {editing === change.id ? 'Close' : 'Edit'}
                              </button>
                            )}
                            {applied && change.selected && (
                              <Check size={15} aria-label="저장 완료" />
                            )}
                          </div>
                          {editing === change.id ? (
                            <input
                              className={styles.titleInput}
                              aria-label="변경안 제목"
                              disabled={!!busy}
                              maxLength={100}
                              value={change.title}
                              onChange={(event) =>
                                setChanges((current) =>
                                  current.map((item) =>
                                    item.id === change.id
                                      ? { ...item, title: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          ) : (
                            <h4>{change.title}</h4>
                          )}
                          {agentDiff(change, change.title, data.projects).map((diff) => (
                            <div className={styles.fieldChange} key={diff.field}>
                              <div className={styles.changeDetail}>
                                <span>{diff.label}</span>
                              </div>
                              <div className={styles.diff}>
                                {diff.before !== null && (
                                  <>
                                    <span className={styles.before}>{diff.before}</span>
                                    <ArrowRight size={13} aria-hidden="true" />
                                  </>
                                )}
                                <span className={styles.after}>{diff.after}</span>
                              </div>
                            </div>
                          ))}
                        </article>
                      );
                    })}
                  </div>
                  {!applied ? (
                    <div className={styles.approval}>
                      <p id="agent-approval-summary" aria-live="polite">
                        <span className={styles.approvalDot} />
                        {selected > 0
                          ? `선택한 ${selected}개 변경사항을 적용해요.`
                          : '적용할 변경사항을 선택해 주세요.'}
                      </p>
                      <button
                        type="button"
                        className={styles.doneButton}
                        disabled={
                          !!busy ||
                          selected === 0 ||
                          changes.some((change) => change.selected && !change.title.trim())
                        }
                        aria-label={busy === 'saving' ? '적용 중' : applyLabel}
                        aria-describedby="agent-approval-summary"
                        onClick={() => void applyChanges()}
                      >
                        <Check size={17} aria-hidden="true" />{' '}
                        {busy === 'saving' ? '적용 중…' : applyLabel}{' '}
                        <span aria-hidden="true">{selected}</span>
                      </button>
                    </div>
                  ) : (
                    <div className={styles.complete}>
                      <AgentPet mood="happy" paused={motionPaused || !!reducedMotion} />
                      <span>
                        All set.<small>선택한 변경을 저장했어요.</small>
                      </span>
                      <button type="button" onClick={reset}>
                        New chat <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </section>
              )}
              {busy === 'thinking' && (
                <p className={styles.notice} role="status">
                  Card를 읽고 변경안을 준비하고 있어요…
                </p>
              )}
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              {notice && (
                <p className={styles.notice} role="status">
                  {notice}
                </p>
              )}
            </div>

            <footer className={styles.footer}>
              <div className={styles.connectionNote}>
                <span />
                {connection?.message ?? '연결 상태를 확인하고 있어요…'}
              </div>
              <form
                className={styles.composer}
                onSubmit={(event) => {
                  event.preventDefault();
                  submit();
                }}
              >
                <label className={styles.srOnly} htmlFor="agent-message">
                  에이전트에게 요청하기
                </label>
                <textarea
                  id="agent-message"
                  ref={composer}
                  value={input}
                  maxLength={2000}
                  rows={2}
                  disabled={!!busy || !connection?.configured}
                  placeholder="새로 생긴 일이나 바뀐 내용을 말해 주세요…"
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing &&
                      event.nativeEvent.keyCode !== 229
                    ) {
                      event.preventDefault();
                      submit();
                    }
                  }}
                />
                <div className={styles.composerFoot}>
                  <span>
                    <CornerDownLeft size={12} aria-hidden="true" /> Enter 전송 <i>·</i> Shift +
                    Enter 줄바꿈
                  </span>
                  <button
                    type="submit"
                    aria-label="메시지 보내기"
                    disabled={!input.trim() || !!busy || !connection?.configured}
                  >
                    <ArrowUp size={19} />
                  </button>
                </div>
              </form>
              <p className={styles.footnote}>
                변경안을 검토하고 <b>직접 적용할 때</b> 저장돼요.
              </p>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
