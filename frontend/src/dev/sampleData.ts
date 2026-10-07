import type { Card, Project, Status } from '@todo-zone/shared';
import { addDays } from '../lib/dates.ts';

// step11-2 전용 가짜 데이터. 11-4에서 서버 데이터로 바뀌면 지운다.
// 내용은 사용자(Yushin)의 실제 상황을 바탕으로 했다. 자유롭게 고쳐도 된다.
// 마감일은 '오늘' 기준 상대값이라 언제 열어도 오늘/내일/지난 마감이 보인다.

const CREATED = '2026-10-01T00:00:00.000Z';

const projects: Project[] = [
  { id: 'inbox', name: 'Inbox', color: 'inbox', icon: 'inbox', isInbox: true },
  { id: 'todo-zone', name: 'TO-DO ZONE', color: 'sage', icon: 'code', isInbox: false },
  { id: 'school', name: '학교', color: 'mist', icon: 'graduation-cap', isInbox: false },
  { id: 'chaeun', name: '채운', color: 'salmon', icon: 'sprout', isInbox: false },
  { id: 'design', name: '디자인 공부', color: 'gold', icon: 'palette', isInbox: false },
].map((p) => ({ ...p, createdAt: CREATED, updatedAt: CREATED }) as Project);

type Seed = { title: string; projectId: string; memo?: string; due?: number };

const seeds: Record<Status, Seed[]> = {
  doing: [
    {
      title: 'Board 화면 만들기 (step11-2)',
      projectId: 'todo-zone',
      memo: '카드 크기 단계, 아이콘, 드래그까지. 이번엔 목업 말고 진짜로!',
      due: 0,
    },
    {
      title: '중간고사 준비 — 전공 범위 정리하고 기출 풀기',
      projectId: 'school',
      memo: '챕터별 요약 노트 → 기출 2회독. 모르는 건 오피스아워 때 질문.',
      due: 5,
    },
    { title: '채운 모바일 내비 태그 다듬기', projectId: 'chaeun', due: 2 },
  ],
  todo: [
    { title: 'API-SPEC 쓰기 (step09)', projectId: 'todo-zone', due: 1 },
    { title: '팀플 회의 일정 잡기', projectId: 'school', due: -1 },
    {
      title: '채운 Stories 페이지 글 정리',
      projectId: 'chaeun',
      memo: '사주·풍수 용어를 쉽게 풀어 쓰기. 글마다 사진 1장씩.',
    },
    { title: 'Awwwards에서 카드형 레퍼런스 5개 더 모으기', projectId: 'design' },
    { title: '교양 과제 제출', projectId: 'school', due: -2 },
    { title: 'TEST-PLAN 쓰기 (step10)', projectId: 'todo-zone' },
    { title: '노트북 충전기 하나 더 살까 고민', projectId: 'inbox' },
  ],
  done: [
    { title: '기획 문서 step01~08 끝내기', projectId: 'todo-zone' },
    { title: 'GitHub 레포 만들고 첫 푸시', projectId: 'todo-zone' },
    { title: 'Readymag · Morrow 디자인 분석', projectId: 'design' },
    { title: '채운 사이트 Vercel 배포', projectId: 'chaeun', due: -4 },
    { title: 'Claude Code 스킬 설치', projectId: 'todo-zone' },
  ],
};

export function makeSampleBoard(today: string): { projects: Project[]; cards: Card[] } {
  const cards: Card[] = [];
  for (const [status, list] of Object.entries(seeds) as [Status, Seed[]][]) {
    list.forEach((s, position) => {
      cards.push({
        id: `${status}-${position}`,
        title: s.title,
        memo: s.memo ?? '',
        dueDate: s.due === undefined ? null : addDays(today, s.due),
        status,
        position,
        projectId: s.projectId,
        createdAt: CREATED,
        updatedAt: CREATED,
      });
    });
  }
  return { projects, cards };
}
