import type { AgentChange, AgentContent, Project } from '@todo-zone/shared';
const LABELS: Record<keyof AgentContent, string> = {
  title: '제목',
  memo: '메모',
  dueDate: 'Due date',
  projectId: 'Project',
  status: 'Status',
  checklist: '체크리스트',
};
export function agentDiff(change: AgentChange, title: string, projects: Project[]) {
  const after = { ...change.after, title };
  function display(field: keyof AgentContent, value: AgentContent[typeof field]) {
    if (field === 'projectId')
      return projects.find((p) => p.id === value)?.name ?? change.projectName;
    if (field === 'status')
      return { todo: 'Todo', doing: 'Doing', done: 'Done' }[value as AgentContent['status']];
    if (field === 'checklist')
      return (
        (value as AgentContent['checklist'])
          .map((entry) => `${entry.checked ? '✓' : '□'} ${entry.text}`)
          .join('\n') || '없음'
      );
    return value === null || value === '' ? '없음' : String(value);
  }
  return (Object.keys(LABELS) as (keyof AgentContent)[])
    .filter((field) => {
      if (change.before)
        return JSON.stringify(change.before[field]) !== JSON.stringify(after[field]);
      return (
        field !== 'title' &&
        (field !== 'memo' || !!after.memo) &&
        (field !== 'checklist' || after.checklist.length > 0)
      );
    })
    .map((field) => ({
      field,
      label: LABELS[field],
      before: change.before ? display(field, change.before[field]) : null,
      after: display(field, after[field]),
    }));
}
