import { useState } from 'react';
import styles from './AgentPet.module.css';

type Mood = 'idle' | 'listening' | 'happy';

/** One transparent PNG, animated as a small pet without extra illustration layers. */
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
  const picture = (
    <span className={styles.body} data-mood={mood}>
      <img
        key={greeting}
        data-greeting={greeting > 0}
        src="/agent/zone-pet.png"
        width="1254"
        height="1254"
        alt=""
        draggable={false}
        decoding="async"
      />
    </span>
  );
  return interactive ? (
    <button
      type="button"
      className={styles.pet}
      data-size={size}
      data-paused={paused}
      aria-label="캐릭터 인사하기"
      onClick={() => setGreeting((value) => value + 1)}
    >
      {picture}
    </button>
  ) : (
    <span className={styles.pet} data-size={size} data-paused={paused} aria-hidden="true">
      {picture}
    </span>
  );
}
