import { useState } from 'react';
import {
  LIMITS,
  STATUSES,
  charCount,
  type Area,
  type Card,
  type ChecklistEntry,
  type Project,
  type Status,
  type UpdateCardInput,
} from '@todo-zone/shared';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { DatePicker } from './DatePicker.tsx';
import { ProjectSelect } from './ProjectSelect.tsx';
import { Segmented } from './Segmented.tsx';
import { Panel } from './Panel.tsx';
import styles from './Panel.module.css';

const STATUS_LABEL: Record<Status, string> = { todo: 'Todo', doing: 'Doing', done: 'Done' };

const clip = (text: string, max: number) =>
  charCount(text) > max ? [...text].slice(0, max).join('') : text;

/** Card 상세 패널 (SCREEN-SPEC S2, PRD F3·F4·F7) */
export function CardPanel({
  card,
  areas,
  projects,
  today,
  onSave,
  onDelete,
  onClose,
}: {
  card: Card;
  areas: Area[];
  projects: Project[];
  today: string;
  onSave: (patch: UpdateCardInput, status: Status | null) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(card.title);
  const [memo, setMemo] = useState(card.memo);
  const [checklist, setChecklist] = useState<ChecklistEntry[]>(card.checklist);
  const [newEntry, setNewEntry] = useState('');
  const [newEntryId, setNewEntryId] = useState(() => crypto.randomUUID());
  const [dueDate, setDueDate] = useState(card.dueDate ?? '');
  const [status, setStatus] = useState<Status>(card.status);
  const [projectId, setProjectId] = useState(card.projectId);
  const [confirm, setConfirm] = useState<'delete' | 'discard' | null>(null);

  // 바뀐 필드만 보낸다 (API-SPEC PATCH)
  const patch: UpdateCardInput = {};
  if (title.trim() !== card.title) patch.title = title.trim();
  if (memo.trim() !== card.memo) patch.memo = memo.trim();
  const cleanedChecklist = checklist.map((entry) => ({ ...entry, text: entry.text.trim() }));
  if (newEntry.trim() && checklist.length < LIMITS.checklistEntries) {
    cleanedChecklist.push({ id: newEntryId, text: newEntry.trim(), checked: false });
  }
  if (JSON.stringify(cleanedChecklist) !== JSON.stringify(card.checklist))
    patch.checklist = cleanedChecklist;
  if ((dueDate || null) !== card.dueDate) patch.dueDate = dueDate || null;
  if (projectId !== card.projectId) patch.projectId = projectId;
  const statusChange = status !== card.status ? status : null;
  const dirty = Object.keys(patch).length > 0 || statusChange !== null;
  const titleEmpty = title.trim() === '';
  const checklistInvalid = cleanedChecklist.some((entry) => !entry.text);
  const addEntry = () => {
    if (!newEntry.trim() || checklist.length >= LIMITS.checklistEntries) return;
    setChecklist([...checklist, { id: newEntryId, text: newEntry.trim(), checked: false }]);
    setNewEntry('');
    setNewEntryId(crypto.randomUUID());
  };

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
              disabled={titleEmpty || checklistInvalid || !dirty}
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

        <section className={styles.field} aria-label="Checklist">
          <div className={styles.fieldFoot}>
            <span className={styles.eyebrow}>Checklist</span>
            <span>
              {checklist.filter((entry) => entry.checked).length} / {checklist.length}
            </span>
          </div>
          {checklist.map((entry, index) => (
            <div className={styles.checklistRow} key={entry.id}>
              <input
                type="checkbox"
                aria-label={`체크리스트 ${index + 1} 완료`}
                checked={entry.checked}
                onChange={(e) =>
                  setChecklist(
                    checklist.map((item) =>
                      item.id === entry.id ? { ...item, checked: e.target.checked } : item,
                    ),
                  )
                }
              />
              <input
                className={styles.input}
                aria-label={`체크리스트 ${index + 1} 내용`}
                value={entry.text}
                data-checked={entry.checked}
                onChange={(e) =>
                  setChecklist(
                    checklist.map((item) =>
                      item.id === entry.id
                        ? { ...item, text: clip(e.target.value, LIMITS.checklistText) }
                        : item,
                    ),
                  )
                }
              />
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={`체크리스트 ${index + 1} 삭제`}
                onClick={() => setChecklist(checklist.filter((item) => item.id !== entry.id))}
              >
                ×
              </button>
            </div>
          ))}
          <div className={styles.checklistAdd}>
            <input
              className={styles.input}
              aria-label="새 체크리스트 내용"
              placeholder="작은 단계 추가"
              value={newEntry}
              disabled={checklist.length >= LIMITS.checklistEntries}
              onChange={(e) => setNewEntry(clip(e.target.value, LIMITS.checklistText))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  addEntry();
                }
              }}
            />
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={addEntry}
              disabled={!newEntry.trim() || checklist.length >= LIMITS.checklistEntries}
            >
              Add
            </button>
          </div>
          {checklistInvalid && <p className={styles.error}>빈 항목을 입력하거나 삭제해 주세요.</p>}
        </section>

        {/* 선택 칸은 직접 만든 부품 (D-080): 애니메이션, 한글 날짜 */}
        <div className={styles.field}>
          <span className={styles.eyebrow}>Due date</span>
          <DatePicker value={dueDate || null} today={today} onChange={(d) => setDueDate(d ?? '')} />
        </div>

        <div className={styles.field}>
          <span className={styles.eyebrow}>Status</span>
          <Segmented
            label="Status"
            options={STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
            value={status}
            onChange={setStatus}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.eyebrow}>Project</span>
          <ProjectSelect
            areas={areas}
            projects={projects}
            value={projectId}
            onChange={setProjectId}
          />
        </div>
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
