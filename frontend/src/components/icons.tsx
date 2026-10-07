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
  type LucideIcon,
} from 'lucide-react';
import type { ProjectIcon } from '@todo-zone/shared';

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
};

export function ProjectIconView({ icon, size = 16 }: { icon: ProjectIcon; size?: number }) {
  const Icon = PROJECT_ICON_COMPONENTS[icon];
  return <Icon size={size} strokeWidth={1.75} aria-hidden="true" />;
}
