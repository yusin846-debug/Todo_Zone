import { useState, type KeyboardEvent } from 'react';
import { Lock, Trash2 } from 'lucide-react';
import {
  LIMITS,
  PROJECT_COLORS,
  PROJECT_ICONS,
  charCount,
  type Card,
  type Project,
} from '@todo-zone/shared';
import type { useProjectActions } from '../api/board.ts';
import { ApiRequestError } from '../api/client.ts';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { ProjectIconView } from './icons.tsx';
import { Panel } from './Panel.tsx';
import styles from './Panel.module.css';

type Actions = ReturnType<typeof useProjectActions>;

const messageOf = (err: unknown) =>
  err instanceof ApiRequestError ? err.message : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.';

/** Projects 관리 (SCREEN-SPEC S3, PRD F8) */
export function ProjectsPanel({
  projects,
  cards,
  actions,
  onClose,
}: {
  projects: Project[];
  cards: Card[];
  actions: Actions;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [picker, setPicker] = useState<{ id: string; kind: 'color' | 'icon' } | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);

  const ordered = [...projects].sort(
    (a, b) => Number(b.isInbox) - Number(a.isInbox) || a.createdAt.localeCompare(b.createdAt),
  );
  const full = projects.length >= LIMITS.projects;

  async function run(work: () => Promise<unknown>) {
    setError(null);
    try {
      await work();
      return true;
    } catch (err) {
      setError(messageOf(err));
      return false;
    }
  }

  async function create() {
    const name = newName.trim();
    if (name === '') return;
    if (await run(() => actions.createProject({ name }))) setNewName('');
  }

  async function rename() {
    if (!editing) return;
    const name = editing.name.trim();
    const current = projects.find((p) => p.id === editing.id);
    if (name === '' || name === current?.name) return setEditing(null);
    if (await run(() => actions.updateProject(editing.id, { name }))) setEditing(null);
  }

  const onEnter = (fn: () => void) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.key === 'Process') return; // 한글 조합 중 Enter 무시
    if (e.key === 'Enter') fn();
  };

  return (
    <>
      <Panel title="Projects" onClose={onClose}>
        <ul className={styles.projectList}>
          {ordered.map((p) => (
            <li key={p.id} className={styles.projectRow}>
              <button
                type="button"
                className={styles.projectChip}
                data-color={p.color}
                disabled={p.isInbox}
                aria-label={`${p.name} 색 바꾸기`}
                onClick={() =>
                  setPicker(
                    picker?.id === p.id && picker.kind === 'color'
                      ? null
                      : { id: p.id, kind: 'color' },
                  )
                }
              />
              <button
                type="button"
                className={styles.iconBtn}
                disabled={p.isInbox}
                aria-label={`${p.name} 아이콘 바꾸기`}
                onClick={() =>
                  setPicker(
                    picker?.id === p.id && picker.kind === 'icon'
                      ? null
                      : { id: p.id, kind: 'icon' },
                  )
                }
              >
                <ProjectIconView icon={p.icon} size={18} />
              </button>

              {editing?.id === p.id ? (
                <input
                  autoFocus
                  className={`${styles.input} ${styles.nameInput}`}
                  aria-label={`${p.name} 새 이름`}
                  value={editing.name}
                  onChange={(e) => setEditing({ id: p.id, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.stopPropagation();
                      setEditing(null);
                    } else onEnter(rename)(e);
                  }}
                  onBlur={() => setEditing(null)}
                />
              ) : (
                <button
                  type="button"
                  className={styles.nameBtn}
                  disabled={p.isInbox}
                  aria-label={`${p.name} 이름 바꾸기`}
                  onClick={() => setEditing({ id: p.id, name: p.name })}
                >
                  {p.name}
                </button>
              )}

              {p.isInbox ? (
                <Lock size={16} className={styles.muted} aria-label="Inbox는 바꿀 수 없어요" />
              ) : (
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label={`${p.name} 삭제`}
                  onClick={() => setDeleting(p)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}

              {picker?.id === p.id && picker.kind === 'color' && (
                <div className={styles.picker} role="group" aria-label="색 고르기">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={styles.projectChip}
                      data-color={c}
                      aria-pressed={p.color === c}
                      aria-label={c}
                      onClick={async () => {
                        if (await run(() => actions.updateProject(p.id, { color: c })))
                          setPicker(null);
                      }}
                    />
                  ))}
                </div>
              )}
              {picker?.id === p.id && picker.kind === 'icon' && (
                <div
                  className={`${styles.picker} ${styles.iconGrid}`}
                  role="group"
                  aria-label="아이콘 고르기"
                >
                  {PROJECT_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={styles.iconBtn}
                      aria-pressed={p.icon === icon}
                      aria-label={icon}
                      onClick={async () => {
                        if (await run(() => actions.updateProject(p.id, { icon }))) setPicker(null);
                      }}
                    >
                      <ProjectIconView icon={icon} size={18} />
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className={styles.field}>
          <span className={styles.eyebrow}>New project</span>
          <input
            data-autofocus
            className={styles.input}
            placeholder="이름을 입력하고 Enter"
            aria-label="새 Project 이름"
            value={newName}
            disabled={full}
            onChange={(e) => setNewName([...e.target.value].slice(0, LIMITS.projectName).join(''))}
            onKeyDown={onEnter(create)}
          />
          <span className={styles.fieldFoot}>
            {full ? (
              <em className={styles.error}>Project는 20개까지 만들 수 있어요.</em>
            ) : (
              <i>
                {charCount(newName)} / {LIMITS.projectName}
              </i>
            )}
            {projects.length} / {LIMITS.projects}
          </span>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </Panel>

      {deleting && (
        <ConfirmDialog
          message={`'${deleting.name}' Project를 삭제할까요? 카드 ${
            cards.filter((c) => c.projectId === deleting.id).length
          }장은 Inbox로 옮겨져요.`}
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            const target = deleting;
            setDeleting(null);
            await run(() => actions.deleteProject(target.id));
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
