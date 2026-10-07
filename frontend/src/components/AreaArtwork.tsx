import type { CardColor } from '@todo-zone/shared';

// Board와 Quarterly Review에서 동일한 Area 이미지를 사용한다.
// Area 이름을 바꿔도 색에 맞는 이미지는 유지된다.
const artwork = {
  gold: 'business',
  mist: 'career',
  salmon: 'ventures',
  sage: 'life',
  inbox: 'unsorted',
} as const;

export function AreaArtwork({
  color,
  size = 32,
  className,
}: {
  color: CardColor;
  size?: number;
  className?: string;
}) {
  return (
    <img
      className={className}
      src={`/images/bento/${artwork[color]}-v2.png`}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      draggable={false}
      style={{ objectFit: 'contain', flexShrink: 0 }}
    />
  );
}
