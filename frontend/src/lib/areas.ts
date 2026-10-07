import type { Area, Card, CardColor, Project } from '@todo-zone/shared';

// Area 관련 화면 로직 (D-083 ~ D-087).

/** 필터는 한 번에 하나: Area 전체 또는 Project 하나 (D-085, D-033) */
export type Filter = { kind: 'area'; id: string } | { kind: 'project'; id: string } | null;

/** 카드 색 = Project의 Area 색. Area가 없거나 Inbox면 크림 (D-086) */
export function colorOf(project: Project, areas: Area[]): CardColor {
  if (project.isInbox || project.areaId === null) return 'inbox';
  return areas.find((a) => a.id === project.areaId)?.color ?? 'inbox';
}

const byCreated = <T extends { createdAt: string }>(a: T, b: T) =>
  a.createdAt.localeCompare(b.createdAt);

export type ProjectGroup = { area: Area | null; projects: Project[] };

/**
 * Area 순서(만든 순)대로 Project를 묶는다. 빈 Area도 남긴다.
 * Area 없는 Project와 Inbox는 마지막 묶음(area: null)에 Inbox가 맨 뒤로 온다.
 */
export function groupProjects(areas: Area[], projects: Project[]): ProjectGroup[] {
  const groups: ProjectGroup[] = [...areas].sort(byCreated).map((area) => ({
    area,
    projects: projects.filter((p) => p.areaId === area.id).sort(byCreated),
  }));
  const loose = projects.filter((p) => p.areaId === null || !areas.some((a) => a.id === p.areaId));
  const rest = [
    ...loose.filter((p) => !p.isInbox).sort(byCreated),
    ...loose.filter((p) => p.isInbox),
  ];
  if (rest.length > 0) groups.push({ area: null, projects: rest });
  return groups;
}

export function matchesFilter(
  card: Pick<Card, 'projectId'>,
  filter: Filter,
  projects: Project[],
): boolean {
  if (filter === null) return true;
  if (filter.kind === 'project') return card.projectId === filter.id;
  return projects.find((p) => p.id === card.projectId)?.areaId === filter.id;
}
