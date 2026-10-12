import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  ArrowUp,
  Check,
  CheckCheck,
  CircleCheck,
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
import type { BoardData } from '../api/board.ts';
import { AgentPet } from './AgentPet.tsx';
import { settle } from '../lib/motion.ts';
import styles from './AgentPanel.module.css';

type ChangeKind = 'create' | 'update' | 'complete';
type Change = {
  id: string;
  kind: ChangeKind;
  title: string;
  detail: string;
  before?: string;
  after: string;
  selected: boolean;
};
type Message = { id: number; role: 'user' | 'agent'; text: string };
const EXAMPLE = '회의 자료 준비를 새로 추가하고, 디자인 검토는 내일로 미뤄줘. 자료 조사는 끝났어.';
const LABELS = { create: 'NEW', update: 'UPDATE', complete: 'COMPLETE' };
const ICONS = { create: FilePlus2, update: Pencil, complete: CheckCheck };

function exampleChanges(): Change[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(tomorrow);
  return [
    {
      id: 'sample-add',
      kind: 'create',
      title: '회의 자료 준비',
      detail: 'Inbox · 마감일 없음',
      after: 'Todo',
      selected: true,
    },
    {
      id: 'sample-date',
      kind: 'update',
      title: '디자인 검토',
      detail: 'Due date',
      before: '미지정',
      after: date,
      selected: true,
    },
    {
      id: 'sample-done',
      kind: 'complete',
      title: '자료 조사',
      detail: 'Status',
      before: 'Doing',
      after: 'Done',
      selected: true,
    },
  ];
}

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

/** UI preview only. No Card mutation or external model call is made in this component. */
export function AgentPanel({
  open,
  data,
  onClose,
}: {
  open: boolean;
  data: BoardData;
  onClose: () => void;
}) {
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
  const selected = changes.filter((change) => change.selected).length;
  const hasConversation = messages.length > 0;

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
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages, applied, notice, open]);

  function append(role: Message['role'], text: string) {
    setMessages((current) => [...current, { id: ++messageId.current, role, text }]);
  }

  function showExample() {
    setMessages([]);
    append('user', EXAMPLE);
    append(
      'agent',
      '이렇게 3개의 변경안을 검토하게 됩니다. 적용할 항목을 고르고, 필요하면 제목을 수정해 보세요.',
    );
    setChanges(exampleChanges());
    setApplied(false);
    setNotice(null);
    setEditing(null);
    setInput('');
    setConfirmReset(false);
  }

  function submit() {
    const text = input.trim();
    if (!text) return;
    append('user', text);
    setInput('');
    setNotice(null);
    append(
      'agent',
      '입력한 내용은 아직 실행되지 않았어요. 지금은 UI 미리보기이며, 자유로운 대화로 Card를 관리하려면 AI 연결이 필요해요. 아래 예시로 변경 검토 흐름을 먼저 확인할 수 있어요.',
    );
    // Preserve any reviewed example changes; arbitrary text is never passed off as interpreted.
    composer.current?.focus();
  }

  function reset() {
    setInput('');
    setMessages([]);
    setChanges([]);
    setApplied(false);
    setNotice(null);
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
      'button:not(:disabled), textarea, input, [tabindex="0"]',
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
                  mood={applied ? 'happy' : input.trim() ? 'listening' : 'idle'}
                  paused={motionPaused || !!reducedMotion}
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
              <span className={styles.previewLabel}>UI PREVIEW</span>
            </div>

            <div className={styles.scroll} ref={scroll}>
              {confirmReset && (
                <div className={styles.resetPrompt}>
                  <p>현재 대화와 예시 변경안을 비울까요?</p>
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
                  <button type="button" className={styles.exampleButton} onClick={showExample}>
                    변경안 예시 체험 <ArrowRight size={14} />
                  </button>
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
                  {changes.length === 0 && (
                    <button type="button" className={styles.exampleButton} onClick={showExample}>
                      변경안 예시 체험 <ArrowRight size={14} />
                    </button>
                  )}
                </>
              )}

              {changes.length > 0 && (
                <section className={styles.review} aria-label="예시 변경안">
                  <div className={styles.reviewHead}>
                    <span>REVIEW CHANGES</span>
                    <span>{applied ? '체험 완료' : `${selected} / ${changes.length} 선택`}</span>
                  </div>
                  <p className={styles.sampleNote}>
                    예시 Card입니다. 실제 Board에는 반영되지 않아요.
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
                                disabled={applied}
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
                                onClick={() => setEditing(editing === change.id ? null : change.id)}
                              >
                                {editing === change.id ? 'Close' : 'Edit'}
                              </button>
                            )}
                            {applied && change.selected && (
                              <Check size={15} aria-label="체험 완료" />
                            )}
                          </div>
                          {editing === change.id ? (
                            <input
                              className={styles.titleInput}
                              aria-label="변경안 제목"
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
                          <div className={styles.changeDetail}>
                            <span>{change.detail}</span>
                          </div>
                          <div className={styles.diff}>
                            {change.before && (
                              <>
                                <span className={styles.before}>{change.before}</span>
                                <ArrowRight size={13} aria-hidden="true" />
                              </>
                            )}
                            <span className={styles.after}>{change.after}</span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  {!applied ? (
                    <div className={styles.approval}>
                      <p>
                        <span className={styles.approvalDot} />
                        확인한 변경만,
                        <br />
                        <strong>당신이 결정한 순간에.</strong>
                      </p>
                      <button
                        type="button"
                        className={styles.doneButton}
                        disabled={
                          selected === 0 ||
                          changes.some((change) => change.selected && !change.title.trim())
                        }
                        aria-label="DONE 예시 변경 적용"
                        onClick={() => {
                          setApplied(true);
                          setEditing(null);
                          setNotice(
                            `${selected}개 변경의 적용 흐름을 체험했어요. 실제 Card는 변경하지 않았어요.`,
                          );
                        }}
                      >
                        <Check size={17} /> DONE <span>{selected}</span>
                      </button>
                    </div>
                  ) : (
                    <div className={styles.complete}>
                      <CircleCheck size={20} />
                      <span>
                        All set.<small>예시 체험을 마쳤어요.</small>
                      </span>
                      <button type="button" onClick={reset}>
                        New chat <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </section>
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
                AI 연결 전 · 예시로 화면을 체험할 수 있어요
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
                  <button type="submit" aria-label="메시지 보내기" disabled={!input.trim()}>
                    <ArrowUp size={19} />
                  </button>
                </div>
              </form>
              <p className={styles.footnote}>
                변경안을 확인한 뒤 <b>DONE</b>으로 마무리해요.
              </p>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
