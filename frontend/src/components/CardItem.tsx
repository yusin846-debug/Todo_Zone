import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Check, CircleAlert, Sun } from 'lucide-react';
import type { Card, CardColor, Project } from '@todo-zone/shared';
import type { CardTier } from '../lib/board.ts';
import { dueLabel } from '../lib/dates.ts';
import { ProjectIconView } from './icons.tsx';
import styles from './Board.module.css';

type Props = { card: Card; project: Project; color: CardColor; tier: CardTier; today: string };

/** 날짜 배지 + 상태 아이콘 (D-017, D-063) */
function DueBadge({ card, today }: { card: Card; today: string }) {
  if (card.dueDate === null) return null;
  const { text, kind } = dueLabel(card.dueDate, today, card.status === 'done');
  const Icon = kind === 'today' ? Sun : kind === 'overdue' ? CircleAlert : Calendar;
  return (
    <span className={styles.due} data-kind={kind}>
      <Icon size={13} strokeWidth={1.75} aria-hidden="true" />
      {kind === 'overdue' && <span className={styles.srOnly}>지난 마감 </span>}
      {text}
    </span>
  );
}

/** Card 한 장의 모양. 크기 단계는 SCREEN-SPEC S1 (D-060). */
export function CardView({ card, project, color, tier, today }: Props) {
  const checklistProgress =
    card.checklist.length > 0 ? (
      <span
        className={styles.checklistProgress}
        aria-label={`체크리스트 ${card.checklist.filter((entry) => entry.checked).length}/${card.checklist.length}`}
      >
        <Check size={12} aria-hidden="true" />
        {card.checklist.filter((entry) => entry.checked).length} / {card.checklist.length}
      </span>
    ) : null;
  if (tier === 'done') {
    return (
      <>
        <span className={styles.doneChip} data-color={color}>
          <Check size={13} strokeWidth={2.5} aria-hidden="true" />
        </span>
        <h3 className={styles.title}>{card.title}</h3>
        {checklistProgress}
      </>
    );
  }

  const chip = (
    <span className={styles.chip}>
      <ProjectIconView icon={project.icon} size={tier === 'focus' ? 22 : tier === 's' ? 14 : 16} />
    </span>
  );

  if (tier === 's') {
    return (
      <div className={styles.row}>
        {chip}
        <h3 className={styles.title}>{card.title}</h3>
        {checklistProgress}
      </div>
    );
  }

  if (tier === 'm') {
    return (
      <>
        <div className={styles.row}>
          {chip}
          <h3 className={styles.title}>{card.title}</h3>
        </div>
        <div className={styles.meta}>
          <DueBadge card={card} today={today} />
          <span>{project.name}</span>
          {checklistProgress}
        </div>
      </>
    );
  }

  // focus, l: 머리(아이콘 + Project) / 제목 / 메모 미리보기 / 메타
  return (
    <>
      <div className={styles.head}>
        {chip}
        <span className={styles.label}>{project.name}</span>
      </div>
      <h3 className={styles.title}>{card.title}</h3>
      {card.memo.trim() !== '' && <p className={styles.memo}>{card.memo}</p>}
      {(card.dueDate !== null || checklistProgress) && (
        <div className={styles.meta}>
          <DueBadge card={card} today={today} />
          {checklistProgress}
        </div>
      )}
    </>
  );
}

/** 드래그할 수 있는 Card (dnd-kit). 집힌 동안 제자리에는 같은 높이의 면만 남는다 (D-061). */
export function SortableCard(props: Props & { onOpen: () => void; alt?: boolean }) {
  const { card, project, tier, onOpen } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { status: card.status },
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={styles.card}
      data-tier={tier}
      data-color={props.color}
      data-alt={props.alt ?? false}
      data-placeholder={isDragging}
      aria-label={`${project.name}: ${card.title}`}
      {...attributes}
      {...listeners}
      // 클릭 또는 Enter로 상세 패널을 연다 (S2). 드래그 집기는 Space만 (Board의 KeyboardSensor).
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen();
        else listeners?.onKeyDown?.(e);
      }}
    >
      <CardView {...props} />
    </article>
  );
}

/** DragOverlay에 그리는 집힌 Card: 회전 없이 살짝 커진다 (D-061). */
export function LiftedCard(props: Props) {
  return (
    <article className={styles.card} data-tier={props.tier} data-color={props.color} data-lifted>
      <CardView {...props} />
    </article>
  );
}
