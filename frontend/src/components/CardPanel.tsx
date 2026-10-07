import { useState } from 'react';
import {
  LIMITS,
  STATUSES,
  charCount,
  type Card,
  type Project,
  type Status,
  type UpdateCardInput,
} from '@todo-zone/shared';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { Panel } from './Panel.tsx';
import styles from './Panel.module.css';

const STATUS_LABEL: Record<Status, string> = { todo: 'Todo', doing: 'Doing', done: 'Done' };

const clip = (text: string, max: number) =>
  charCount(text) > max ? [...text].slice(0, max).join('') : text;

/** Card 상세 패널 (SCREEN-SPEC S2, PRD F3·F4·F7) */
export function CardPanel({
  card,
  projects,
  onSave,
  onDelete,
  onClose,
}: {
  card: Card;
  projects: Project[];
  onSave: (patch: UpdateCardInput, status: Status | null) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(card.title);
  const [memo, setMemo] = useState(card.memo);
  const [dueDate, setDueDate] = useState(card.dueDate ?? '');
  const [status, setStatus] = useState<Status>(card.status);
  const [projectId, setProjectId] = useState(card.projectId);
  const [confirm, setConfirm] = useState<'delete' | 'discard' | null>(null);

  // 바뀐 필드만 보낸다 (API-SPEC PATCH)
  const patch: UpdateCardInput = {};
  if (title.trim() !== card.title) patch.title = title.trim();
  if (memo.trim() !== card.memo) patch.memo = memo.trim();
  if ((dueDate || null) !== card.dueDate) patch.dueDate = dueDate || null;
  if (projectId !== card.projectId) patch.projectId = projectId;
  const statusChange = status !== card.status ? status : null;
  const dirty = Object.keys(patch).length > 0 || statusChange !== null;
  const titleEmpty = title.trim() === '';

  const close = () => (dirty ? setConfirm('discard') : onClose());

  return (
    <>
      <Panel
        title="Card"
        onClose={close}
        footer={
          <>
            <button type="button" className={styles.dangerBtn} onClick={() => setConfirm('delete')}>
              Delete
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={titleEmpty || !dirty}
              onClick={() => {
                onSave(patch, statusChange);
                onClose();
              }}
            >
              Save
            </button>
          </>
        }
      >
        <label className={styles.field}>
          <span className={styles.eyebrow}>Title</span>
          <textarea
            data-autofocus
            className={`${styles.input} ${styles.titleInput}`}
            rows={2}
            value={title}
            onChange={(e) => setTitle(clip(e.target.value.replace(/\n/g, ' '), LIMITS.cardTitle))}
          />
          <span className={styles.fieldFoot}>
            {titleEmpty ? <em className={styles.error}>제목을 입력해 주세요.</em> : <i />}
            {charCount(title)} / {LIMITS.cardTitle}
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.eyebrow}>Memo</span>
          <textarea
            className={`${styles.input} ${styles.memoInput}`}
            value={memo}
            onChange={(e) => setMemo(clip(e.target.value, LIMITS.cardMemo))}
          />
          <span className={styles.fieldFoot}>
            <i />
            {charCount(memo).toLocaleString()} / {LIMITS.cardMemo.toLocaleString()}
          </span>
        </label>

        <div className={styles.row2}>
          <label className={styles.field}>
            <span className={styles.eyebrow}>Due date</span>
            <span className={styles.dateRow}>
              <input
                type="date"
                className={styles.input}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              {dueDate && (
                <button
                  type="button"
                  className={styles.ghostBtn}
                  aria-label="마감일 지우기"
                  onClick={() => setDueDate('')}
                >
                  ✕
                </button>
              )}
            </span>
          </label>
          <label className={styles.field}>
            <span className={styles.eyebrow}>Status</span>
            <select
              className={styles.input}
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.eyebrow}>Project</span>
          <select
            className={styles.input}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </Panel>

      {confirm === 'delete' && (
        <ConfirmDialog
          message="이 카드를 삭제할까요? 삭제하면 되돌릴 수 없어요."
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            onDelete();
            onClose();
          }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'discard' && (
        <ConfirmDialog
          message="저장하지 않은 변경이 있어요. 닫을까요?"
          confirmLabel="Close"
          onConfirm={onClose}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
