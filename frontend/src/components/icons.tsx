import {
  BookOpen,
  Briefcase,
  Camera,
  Car,
  Code,
  Coffee,
  Dumbbell,
  Folder,
  Footprints,
  Gamepad2,
  GraduationCap,
  Heart,
  House,
  Inbox,
  Laptop,
  Music,
  Palette,
  PenTool,
  Plane,
  ShoppingBag,
  Sprout,
  Star,
  Users,
  Utensils,
  Wallet,
  createLucideIcon,
  type LucideIcon,
} from 'lucide-react';
import type { ProjectIcon } from '@todo-zone/shared';

// D-078: 김밥 단면. Lucide에 없어서 같은 규격(24×24, 둥근 선 끝)으로 직접 그렸다.
// 굵은 김 테두리 + 비대칭으로 빽빽한 속재료 6개 (속재료가 2~3개면 얼굴처럼 보여서 6개로 했다).
const filled = { fill: 'currentColor', stroke: 'none' } as const;
const Gimbap = createLucideIcon('gimbap', [
  ['circle', { cx: '12', cy: '12', r: '8.6', strokeWidth: '3', key: 'laver' }],
  ['rect', { x: '9.1', y: '8.3', width: '2.9', height: '2.9', rx: '0.5', ...filled, key: 'f1' }],
  ['path', { d: 'M12.9 8.4l2.6.6-.9 2.5z', ...filled, key: 'f2' }],
  ['circle', { cx: '9.3', cy: '13', r: '1.25', ...filled, key: 'f3' }],
  [
    'rect',
    {
      x: '11.2',
      y: '12',
      width: '1.9',
      height: '4.2',
      rx: '0.6',
      transform: 'rotate(-20 12.15 14.1)',
      ...filled,
      key: 'f4',
    },
  ],
  ['circle', { cx: '15.3', cy: '13.4', r: '1.15', ...filled, key: 'f5' }],
  ['rect', { x: '13.4', y: '15.4', width: '2.2', height: '1.5', rx: '0.5', ...filled, key: 'f6' }],
]);

// D-062: Project 아이콘 이름 → Lucide 컴포넌트
const PROJECT_ICON_COMPONENTS: Record<ProjectIcon, LucideIcon> = {
  inbox: Inbox,
  folder: Folder,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  briefcase: Briefcase,
  laptop: Laptop,
  code: Code,
  'pen-tool': PenTool,
  palette: Palette,
  music: Music,
  dumbbell: Dumbbell,
  footprints: Footprints,
  heart: Heart,
  users: Users,
  house: House,
  'shopping-bag': ShoppingBag,
  utensils: Utensils,
  wallet: Wallet,
  plane: Plane,
  car: Car,
  'gamepad-2': Gamepad2,
  camera: Camera,
  sprout: Sprout,
  star: Star,
  coffee: Coffee,
  gimbap: Gimbap,
};

export function ProjectIconView({ icon, size = 16 }: { icon: ProjectIcon; size?: number }) {
  const Icon = PROJECT_ICON_COMPONENTS[icon];
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" />;
}
