import { useState, type KeyboardEvent } from 'react';
import { FolderInput, Lock, Plus, Trash2 } from 'lucide-react';
import {
  AREA_COLORS,
  LIMITS,
  PROJECT_ICONS,
  charCount,
  type Area,
  type Card,
  type Project,
} from '@todo-zone/shared';
import type { useProjectActions } from '../api/board.ts';
import { ApiRequestError } from '../api/client.ts';
import { colorOf, groupProjects } from '../lib/areas.ts';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { ProjectIconView } from './icons.tsx';
import { Panel } from './Panel.tsx';
import styles from './Panel.module.css';

type Actions = ReturnType<typeof useProjectActions>;
type Picker = { id: string; kind: 'areaColor' | 'icon' | 'move' } | null;
type Deleting = { kind: 'project'; item: Project } | { kind: 'area'; item: Area } | null;

const messageOf = (err: unknown) =>
  err instanceof ApiRequestError ? err.message : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.';

/** 한글 조합 중 Enter는 무시한다 */
const onEnter = (fn: () => void) => (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.nativeEvent.isComposing || e.key === 'Process') return;
  if (e.key === 'Enter') fn();
};

/** Projects 관리 (SCREEN-SPEC S3, PRD F8, D-084): Area별로 묶어서 보여 준다 */
export function ProjectsPanel({
  areas,
  projects,
  cards,
  actions,
  onClose,
}: {
  areas: Area[];
  projects: Project[];
  cards: Card[];
  actions: Actions;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [adding, setAdding] = useState<{ areaId: string | null; name: string } | null>(null);
  const [newArea, setNewArea] = useState('');
  const [picker, setPicker] = useState<Picker>(null);
  const [deleting, setDeleting] = useState<Deleting>(null);

  const groups = groupProjects(areas, projects);
  // Area 없는 묶음은 Project가 없어도 "+ Add project" 자리를 위해 보여 준다
  if (!groups.some((g) => g.area === null)) groups.push({ area: null, projects: [] });
  const projectsFull = projects.length >= LIMITS.projects;
  const areasFull = areas.length >= LIMITS.areas;

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

  const togglePicker = (id: string, kind: NonNullable<Picker>['kind']) =>
    setPicker(picker?.id === id && picker.kind === kind ? null : { id, kind });

  async function saveName() {
    if (!editing) return;
    const name = editing.name.trim();
    const area = areas.find((a) => a.id === editing.id);
    const current = area?.name ?? projects.find((p) => p.id === editing.id)?.name;
    if (name === '' || name === current) return setEditing(null);
    const ok = await run(() =>
      area ? actions.updateArea(editing.id, { name }) : actions.updateProject(editing.id, { name }),
    );
    if (ok) setEditing(null);
  }

  async function addProject() {
    if (!adding) return;
    const name = adding.name.trim();
    if (name === '') return;
    if (await run(() => actions.createProject({ name, areaId: adding.areaId }))) setAdding(null);
  }

  async function addArea() {
    const name = newArea.trim();
    if (name === '') return;
    if (await run(() => actions.createArea({ name }))) setNewArea('');
  }

  const nameField = (id: string, name: string, locked = false) =>
    editing?.id === id ? (
      <input
        autoFocus
        className={`${styles.input} ${styles.nameInput}`}
        aria-label={`${name} 새 이름`}
        value={editing.name}
        onChange={(e) => setEditing({ id, name: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            setEditing(null);
          } else onEnter(saveName)(e);
        }}
        onBlur={() => setEditing(null)}
      />
    ) : (
      <button
        type="button"
        className={styles.nameBtn}
        disabled={locked}
        aria-label={`${name} 이름 바꾸기`}
        onClick={() => setEditing({ id, name })}
      >
        {name}
      </button>
    );

  const moveTargets = [
    ...areas.map((a) => ({ id: a.id as string | null, name: a.name, color: a.color as string })),
    { id: null, name: 'Unsorted', color: 'inbox' },
  ];

  return (
    <>
      <Panel title="Projects" onClose={onClose}>
        {groups.map((g, gi) => {
          const area = g.area;
          return (
            <section
              key={area?.id ?? 'none'}
              className={styles.areaSection}
              aria-label={area?.name ?? 'Unsorted'}
            >
              {/* Area 머리: 색 · 이름 · 삭제 */}
              <div className={styles.areaHead}>
                {area ? (
                  <>
                    <button
                      type="button"
                      className={styles.projectChip}
                      data-color={area.color}
                      aria-label={`${area.name} 색 바꾸기`}
                      onClick={() => togglePicker(area.id, 'areaColor')}
                    />
                    <span className={styles.areaName}>{nameField(area.id, area.name)}</span>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={`${area.name} Area 삭제`}
                      onClick={() => setDeleting({ kind: 'area', item: area })}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className={styles.projectChip} data-color="inbox" />
                    <span className={`${styles.areaName} ${styles.muted}`}>Unsorted</span>
                  </>
                )}
              </div>
              {area && picker?.id === area.id && picker.kind === 'areaColor' && (
                <div className={styles.picker} role="group" aria-label="색 고르기">
                  {AREA_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={styles.projectChip}
                      data-color={c}
                      aria-pressed={area.color === c}
                      aria-label={c}
                      onClick={async () => {
                        if (await run(() => actions.updateArea(area.id, { color: c })))
                          setPicker(null);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* 그 Area의 Project들 */}
              <ul className={styles.projectList}>
                {g.projects.map((p) => (
                  <li key={p.id} className={styles.projectRow}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      data-tint={colorOf(p, areas)}
                      disabled={p.isInbox}
                      aria-label={`${p.name} 아이콘 바꾸기`}
                      onClick={() => togglePicker(p.id, 'icon')}
                    >
                      <ProjectIconView icon={p.icon} size={18} />
                    </button>
                    {nameField(p.id, p.name, p.isInbox)}
                    {p.isInbox ? (
                      <Lock
                        size={16}
                        className={styles.muted}
                        aria-label="Inbox는 바꿀 수 없어요"
                      />
                    ) : (
                      <span className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label={`${p.name} Area 옮기기`}
                          onClick={() => togglePicker(p.id, 'move')}
                        >
                          <FolderInput size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          aria-label={`${p.name} 삭제`}
                          onClick={() => setDeleting({ kind: 'project', item: p })}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </span>
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
                              if (await run(() => actions.updateProject(p.id, { icon })))
                                setPicker(null);
                            }}
                          >
                            <ProjectIconView icon={icon} size={18} />
                          </button>
                        ))}
                      </div>
                    )}
                    {picker?.id === p.id && picker.kind === 'move' && (
                      <div
                        className={`${styles.picker} ${styles.movePicker}`}
                        role="group"
                        aria-label="Area 고르기"
                      >
                        {moveTargets.map((a) => (
                          <button
                            key={a.id ?? 'none'}
                            type="button"
                            className={styles.moveOption}
                            aria-pressed={p.areaId === a.id}
                            onClick={async () => {
                              if (await run(() => actions.updateProject(p.id, { areaId: a.id })))
                                setPicker(null);
                            }}
                          >
                            <span className={styles.dotSmall} data-color={a.color} />
                            {a.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {/* 그 Area에 Project 추가 */}
              {adding?.areaId === (area?.id ?? null) ? (
                <input
                  autoFocus
                  className={styles.input}
                  placeholder="Project 이름을 입력하고 Enter"
                  aria-label={`${area?.name ?? 'Unsorted'}에 새 Project`}
                  value={adding.name}
                  onChange={(e) =>
                    setAdding({
                      areaId: adding.areaId,
                      name: [...e.target.value].slice(0, LIMITS.projectName).join(''),
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.stopPropagation();
                      setAdding(null);
                    } else onEnter(addProject)(e);
                  }}
                  onBlur={() => setAdding(null)}
                />
              ) : (
                <button
                  type="button"
                  className={styles.addRow}
                  disabled={projectsFull}
                  data-autofocus={gi === 0 ? true : undefined}
                  aria-label={`${area?.name ?? 'Unsorted'}에 Project 추가`}
                  onClick={() => setAdding({ areaId: area?.id ?? null, name: '' })}
                >
                  <Plus size={14} aria-hidden="true" /> Add project
                </button>
              )}
            </section>
          );
        })}

        <div className={styles.field}>
          <span className={styles.eyebrow}>New area</span>
          <input
            className={styles.input}
            placeholder="Area 이름을 입력하고 Enter"
            aria-label="새 Area 이름"
            value={newArea}
            disabled={areasFull}
            onChange={(e) => setNewArea([...e.target.value].slice(0, LIMITS.areaName).join(''))}
            onKeyDown={onEnter(addArea)}
          />
          <span className={styles.fieldFoot}>
            {areasFull ? (
              <em className={styles.error}>Area는 8개까지 만들 수 있어요.</em>
            ) : (
              <i>
                {charCount(newArea)} / {LIMITS.areaName}
              </i>
            )}
            Areas {areas.length} / {LIMITS.areas} · Projects {projects.length} / {LIMITS.projects}
          </span>
        </div>

        {projectsFull && <p className={styles.error}>Project는 20개까지 만들 수 있어요.</p>}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </Panel>

      {deleting?.kind === 'project' && (
        <ConfirmDialog
          message={`'${deleting.item.name}' Project를 삭제할까요? 카드 ${
            cards.filter((c) => c.projectId === deleting.item.id).length
          }장은 Inbox로 옮겨져요.`}
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            const target = deleting.item;
            setDeleting(null);
            await run(() => actions.deleteProject(target.id));
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
      {deleting?.kind === 'area' && (
        <ConfirmDialog
          message={`'${deleting.item.name}' Area를 삭제할까요? Project ${
            projects.filter((p) => p.areaId === deleting.item.id).length
          }개는 Unsorted로 옮겨져요. 카드는 그대로예요.`}
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            const target = deleting.item;
            setDeleting(null);
            await run(() => actions.deleteArea(target.id));
          }}
          onCancel={() => setDeleting(null)}
        />
      )}
    </>
  );
}
