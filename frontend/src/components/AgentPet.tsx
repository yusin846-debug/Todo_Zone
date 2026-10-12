import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import styles from './AgentPet.module.css';

type Mood = 'idle' | 'listening' | 'happy';
type Action = 'idle' | 'wave' | 'listen' | 'happy';
const ATLAS = '/agent/zone-pet-frames.png';
const CLIPS = {
  idle: { row: 0, holds: [2200, 160, 100, 110, 100, 180, 240, 300], loop: true },
  wave: { row: 1, holds: [120, 120, 130, 110, 150, 130, 150, 200], loop: false },
  listen: { row: 2, holds: [350, 180, 280, 650, 110, 500, 160, 450], loop: true },
  happy: { row: 3, holds: [100, 160, 100, 110, 180, 100, 130, 300], loop: false },
} satisfies Record<Action, { row: number; holds: number[]; loop: boolean }>;

/** Each step displays a separately drawn pose; no rotation or scaling animation. */
function Sprite({
  action,
  paused,
  onWaveEnd,
}: {
  action: Action;
  paused: boolean;
  onWaveEnd: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pose, setPose] = useState({ action, column: 0 });
  const loader = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (loader.current?.complete && loader.current.naturalWidth > 0) setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || paused) return;
    let current = action;
    let column = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function schedule() {
      if (document.hidden) return;
      timer = setTimeout(() => {
        column += 1;
        if (column === CLIPS[current].holds.length) {
          column = 0;
          if (current === 'wave') {
            onWaveEnd();
            return;
          }
          if (!CLIPS[current].loop) current = 'idle';
        }
        setPose({ action: current, column });
        schedule();
      }, CLIPS[current].holds[column]);
    }
    function visibilityChanged() {
      clearTimeout(timer);
      schedule();
    }
    schedule();
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', visibilityChanged);
    };
  }, [action, paused, ready, onWaveEnd]);

  const row = paused ? 0 : CLIPS[pose.action].row;
  const column = paused ? 0 : pose.column;
  return (
    <>
      <img
        ref={loader}
        className={styles.loader}
        src={ATLAS}
        alt=""
        aria-hidden="true"
        onLoad={() => setReady(true)}
        onError={() => setFailed(true)}
      />
      {failed ? (
        <img className={styles.fallback} src="/agent/zone-pet.png" alt="" draggable={false} />
      ) : (
        <span
          className={styles.sprite}
          data-action={paused ? 'idle' : pose.action}
          style={{ backgroundPosition: `${(column / 7) * 100}% ${(row / 3) * 100}%` }}
        />
      )}
    </>
  );
}

export function AgentPet({
  size = 'small',
  mood = 'idle',
  paused = false,
  interactive = false,
}: {
  size?: 'tiny' | 'small' | 'hero';
  mood?: Mood;
  paused?: boolean;
  interactive?: boolean;
}) {
  const [greeting, setGreeting] = useState(0);
  const [greetedMood, setGreetedMood] = useState<Mood | null>(null);
  const [lastMood, setLastMood] = useState(mood);
  if (lastMood !== mood) {
    setLastMood(mood);
    setGreetedMood(null);
  }
  const finishGreeting = useCallback(() => setGreetedMood(null), []);
  const reducedMotion = useReducedMotion();
  const stopped = paused || !!reducedMotion;
  const action: Action =
    greeting > 0 && greetedMood === mood ? 'wave' : mood === 'listening' ? 'listen' : mood;
  // Remount the player on a new interaction or mood, cancelling the previous clip.
  const picture = (
    <Sprite
      key={`${action}:${mood}:${greeting}:${stopped}`}
      action={action}
      paused={stopped}
      onWaveEnd={finishGreeting}
    />
  );
  return interactive ? (
    <button
      type="button"
      className={styles.pet}
      data-size={size}
      aria-label="캐릭터 인사하기"
      onClick={() => {
        setGreetedMood(mood);
        setGreeting((value) => value + 1);
      }}
    >
      {picture}
    </button>
  ) : (
    <span className={styles.pet} data-size={size} aria-hidden="true">
      {picture}
    </span>
  );
}
