import { useEffect, useState } from 'react';

// 화면 전환: Board(기본) / Review(#review). 라우터 패키지 없이 주소의 # 부분만 쓴다 (D-081).

export type View = 'board' | 'review';

const fromHash = (): View => (window.location.hash === '#review' ? 'review' : 'board');

export function useView(): [View, (view: View) => void] {
  const [view, setView] = useState<View>(fromHash);

  useEffect(() => {
    const onHash = () => setView(fromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return [
    view,
    (next) => {
      // 새로고침해도 유지되고, 브라우저 뒤로 가기로 돌아올 수 있다
      window.location.hash = next === 'review' ? 'review' : '';
      setView(next);
    },
  ];
}
