import { useState, type KeyboardEvent } from 'react';
import { LIMITS, charCount } from '@todo-zone/shared';
import styles from './Board.module.css';

/** 열 맨 위의 새 Card 입력 (F2, SCREEN-SPEC S1). Enter로 만들고 입력칸은 남는다. */
export function NewCardInput({
  onCreate,
  onClose,
}: {
  onCreate: (title: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState('');

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // 한글 조합 중 Enter는 무시한다. 안 그러면 마지막 글자가 한 번 더 입력된다.
    if (e.nativeEvent.isComposing || e.key === 'Process') return;
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'Enter') {
      const title = value.trim();
      if (title === '') return;
      onCreate(title);
      setValue('');
    }
  }

  return (
    <input
      className={styles.newInput}
      autoFocus
      value={value}
      placeholder="카드 제목을 입력하고 Enter"
      aria-label="새 카드 제목"
      onChange={(e) => {
        const next = e.target.value;
        // 100자는 코드 포인트 기준 (DATA-MODEL 3). maxLength는 이모지를 2로 세서 쓰지 않는다.
        setValue(
          charCount(next) > LIMITS.cardTitle ? [...next].slice(0, LIMITS.cardTitle).join('') : next,
        );
      }}
      onKeyDown={handleKeyDown}
      onBlur={onClose}
    />
  );
}
