import type { Transition, Variants } from 'motion/react';

// "물방울" 모션 토큰 (SCREEN-SPEC 1.5, D-079). 값을 바꿀 때는 이 파일만 고친다.

/** 탄성 있게 한 번 넘쳤다가 자리 잡는다: 선택 표시, 팝오버, 막대 */
export const droplet: Transition = { type: 'spring', stiffness: 420, damping: 22, mass: 0.9 };

/** 출렁임 없이 부드럽게 멈춘다: 패널, 화면 전환 */
export const settle: Transition = { type: 'spring', stiffness: 260, damping: 28 };

/** 누를 때 살짝 눌렸다가 droplet으로 돌아온다 */
export const press = { whileTap: { scale: 0.94 }, transition: droplet } as const;

/** 팝오버가 동그랗게 맺혔다가 퍼진다 */
export const bloom: Variants = {
  hidden: { opacity: 0, scale: 0.6, borderRadius: 40 },
  shown: { opacity: 1, scale: 1, borderRadius: 16, transition: droplet },
  gone: { opacity: 0, scale: 0.8, transition: { duration: 0.12 } },
};

/** 목록 항목이 차례로 떨어진다 (부모에 stagger) */
export const drip: Variants = {
  hidden: { opacity: 0, y: -6 },
  shown: { opacity: 1, y: 0, transition: droplet },
};

export const dripParent = (gap = 0.04): Variants => ({
  hidden: {},
  shown: { transition: { staggerChildren: gap } },
});
