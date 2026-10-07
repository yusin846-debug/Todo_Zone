# 디자인 인사이트 — Readymag 레퍼런스

- 출처: https://readymag.com/ (2026-10-07 분석)
- 분석 방법: 페이지에 내장된 전역 텍스트 스타일 JSON 추출 + 헤드리스 Chrome 스크린샷(1440×900)
- 용도: TO-DO 앱의 SCREEN-SPEC(step07)과 frontend(step11-2)에서 참고할 **스타일 원칙**만 차용한다. 이미지, 로고, 카피, 유료 폰트는 가져오지 않는다.

---

## 1. 한 줄 요약

**"조용한 UI 크롬 + 큰 타이포 + 단 하나의 강렬한 오렌지."**
UI 요소(내비게이션, 버튼, 카드)는 흰색·회색 알약형으로 최대한 중립적으로 두고, 시선은 큰 헤드라인과 오렌지 CTA 하나에만 모이도록 설계되어 있다.

## 2. 컬러 시스템

Readymag 색상 표기는 `RRGGBB + 불투명도(0–100)` 형식이다. 예: `00000064` = #000000, 100%.

| 역할 | 값 | 비고 |
|---|---|---|
| 본문 텍스트 | `#000000` / `#222222` / `#282828` | 순검정에 가까운 잉크색 |
| 보조 텍스트 | `#A2A2A2` 계열 | 헤드라인 2행을 회색으로 처리 ("Make the web…" 아래 줄) |
| 배경 | `#FFFFFF`, 섹션 구분 `#F4F4F4` / 연회색 | |
| 다크 패널 | `#444444` ~ `#4F4F4F` (반투명) | 설정 패널, 쿠키 바 |
| **브랜드 액센트** | **`#FF5900`** (오렌지) | 주요 CTA("Sign up", "Try Readymag")에만 사용 |
| 링크/보조 액센트 | `#0080FF` | 드물게 사용 |

**TO-DO 적용:**
- 액센트 컬러는 **1개만** 정하고 "할 일 추가" 같은 주요 액션에만 사용한다. 완료 체크나 삭제에는 쓰지 않는다.
- 완료된 항목은 취소선 대신(또는 함께) **보조 회색 `#A2A2A2`** 으로 톤을 낮춰 보여준다. Readymag 헤드라인 2행 기법과 같다.
- 텍스트는 순검정 `#000`보다 `#222`를 기본값으로 쓴다.

## 3. 타이포그래피

### 원본 스케일 (전역 텍스트 스타일, px)

| 스타일 | 폰트 | size / line-height | letter-spacing |
|---|---|---|---|
| Header 1 | Px Grotesk 400 | 60 / 52 | -2 |
| Header 2 | Px Grotesk 400 | 40 / 38 | -1.8 |
| Header 3 | Px Grotesk 400 | 28 / 28 | -1 |
| Header 1 (UI) | Inter 400 | 38 / 40 | -1.3 |
| Header 2 (UI) | Inter 400 | 16 / 20 | -0.2 |
| Body 1 | Px Grotesk 400 | 21 / 24 | -1 |
| Body 2 | Px Grotesk 400 | 18 / 20 | -0.8 |
| Body (UI) | Inter 400 | 14 / 16, 12 / 14 | 0 |
| Caption | Px Grotesk **700** | 14 / 16, 12 / 14 | -0.2 / 0 |
| Caption (UI) | Inter 400 | 9 / 12, 8 / 10 | -0.1 / +0.2 |

### 패턴
1. **두께는 400 하나로 통일**한다. 위계는 굵기가 아니라 **크기와 색(검정↔회색)** 으로 만든다. 700은 작은 캡션에만 쓴다.
2. **큰 글자일수록 자간과 행간을 더 좁힌다.** 60px에서 line-height 52(0.87), letter-spacing -2. 헤드라인이 단단한 덩어리로 읽힌다.
3. **작은 글자는 자간 0 이상**, 행간은 크기의 약 1.15–1.25배로 둔다.
4. 대문자 변환(text-transform)은 쓰지 않는다. 모두 문장형 대소문자다.
5. 두 가족만 쓴다. 표현용은 그로테스크(Px Grotesk), UI용은 Inter.

**TO-DO 적용 (무료 폰트 대체):**
- Px Grotesk는 유료 폰트이므로 Google Fonts로 대체한다. 후보 9종을 H1 설정(60/52, -2)으로 렌더링해 비교한 결과(2026-10-07)는 아래와 같다.

  | 후보 | 판정 | 메모 |
  |---|---|---|
  | **Inter Tight** | ✅ **채택** | 좁은 폭과 촘촘한 자간이 원본 헤드라인과 가장 닮았다. UI 폰트 Inter와 같은 가족이라 조합이 자연스럽다. wght 100–900 |
  | Instrument Sans | 대안 | 약간 좁고 날카롭다. `wdth` 축(75–100)으로 더 압축할 수 있다. wght 400–700 |
  | Funnel Display | 대안(개성↑) | 디스플레이 전용이고 리듬감이 있다. 브랜드 느낌을 더 내고 싶을 때 쓴다 |
  | Hanken / Schibsted / Host Grotesk, Geist | ✗ | 폭이 넓고 자간이 느슨해서 Readymag 특유의 단단한 덩어리감이 약하다 |
  | Familjen / Bricolage Grotesque | ✗ | 형태 개성(a, k 등)이 강해서 중립적인 원본과 결이 다르다 |

- 한글: Pretendard는 **Google Fonts에 없다**. 둘 중 하나를 선택한다.
  - Google Fonts만 쓸 경우: **Noto Sans KR** (wght 100–900, 가변)
  - CDN 허용 시: **Pretendard** (jsDelivr `pretendard` 패키지). Inter와 메트릭이 맞춰져 있어 섞어 쓸 때 더 자연스럽다.
- 로드 예시:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;700&family=Inter:wght@400;500;700&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
  ```
- 제안 스케일:

  | 토큰 | 용도 | size/lh | ls |
  |---|---|---|---|
  | `display` | 화면 제목 ("오늘", "Today") | 40/38 | -1.5 |
  | `title` | 섹션/리스트 제목 | 28/28 | -1 |
  | `body-lg` | 할 일 텍스트 | 18/22 | -0.4 |
  | `body` | 입력창, 버튼 | 16/20 | -0.2 |
  | `caption` | 마감일, 개수 | 12/14 | 0 |

  한글은 음수 자간을 절반 정도로 줄여서 적용한다.

## 4. 컴포넌트 패턴

| 요소 | Readymag | TO-DO 적용 |
|---|---|---|
| 상단 내비 | 가운데에 **흰 알약형(pill) 버튼이 떨어져 나열**됨 (Solutions/Pricing/…), 좌측 원형 로고, 우측 Log in(흰)·Sign up(오렌지) | 필터 탭(전체 / 진행 중 / 완료)을 흰 pill로 만들고, 선택된 탭만 검정 또는 액센트로 반전 |
| 주요 CTA | 높이 약 84px의 **완전 둥근(pill) 오렌지 버튼**, 흰 텍스트, 카드 폭 가득 | "할 일 추가" 버튼을 full-width pill + 액센트로 |
| 카드 | 흰 배경, radius 약 12px, 그림자 없음, 넉넉한 내부 여백 약 24px | 할 일 입력 영역과 리스트 컨테이너를 같은 형태로 |
| 다크 패널 | `#444` 반투명, radius 약 16px, 행마다 라벨 + 우측 체크박스/토글 | 설정/필터 패널 행 레이아웃: 라벨 좌측, 컨트롤 우측 |
| 비활성 상태 | 같은 행을 **흐린 텍스트**로 처리 ("Preview animation") | 완료·비활성 할 일은 opacity나 회색 텍스트로 |
| 토스트/쿠키 바 | 하단 좌측 플로팅 다크 pill, 내부에 작은 흰 pill 버튼 3개 | 삭제 후 "실행 취소" 스낵바를 같은 형태로 |

**공통 원칙:** 그림자를 쓰지 않는다. 깊이는 **면 색 대비(흰↔회↔다크)** 로만 표현한다. 모서리는 **pill(999px) 또는 12–16px** 두 가지만 쓴다.

## 5. 레이아웃 & 모션

- **모듈형 타일 그리드:** 서로 다른 콘텐츠 타일이 간격 없이 맞붙은 콜라주 구성이다. 그 위에 흰 카드 하나가 떠서 메시지를 전달한다. TO-DO 앱에서는 과하므로 배경은 단색으로 두고 **"하나의 카드에 집중"** 하는 구도만 가져온다.
- **넓은 여백 + 좌측 정렬:** 텍스트는 모두 좌측 정렬이고 중앙 정렬은 쓰지 않는다.
- **반응형 기준폭:** 1024(데스크톱), 375(모바일) 두 개다. TO-DO도 이 두 브레이크포인트로 설계한다.
- **스크롤 연동 애니메이션:** 타일이 스크롤에 따라 순환한다(카운터 숫자 9 → 11 → 17 변화). TO-DO에서는 리스트 추가/삭제 시 짧은 슬라이드·페이드(150–200ms) 정도로만 차용한다.

## 6. 바로 쓸 수 있는 CSS 토큰 초안

```css
:root {
  --color-ink: #222222;
  --color-ink-muted: #a2a2a2;
  --color-bg: #ffffff;
  --color-surface: #f4f4f4;
  --color-panel: #444444;
  --color-accent: #ff5900;
  --color-on-accent: #ffffff;

  --font-display: "Inter Tight", "Pretendard", "Noto Sans KR", system-ui, sans-serif;
  --font-ui: "Inter", "Pretendard", "Noto Sans KR", system-ui, sans-serif;

  --radius-pill: 999px;
  --radius-card: 12px;
  --radius-panel: 16px;

  --space-1: 4px; --space-2: 8px; --space-3: 12px;
  --space-4: 16px; --space-6: 24px; --space-8: 32px;

  --motion-fast: 150ms ease-out;
}
```

## 7. 차용하지 않을 것

- 사진 콜라주와 실제 이미지 에셋, Readymag 로고, 카피 문구
- Px Grotesk 등 라이선스가 필요한 커스텀 폰트
- 화면 전체를 쓰는 스크롤 연출 (TO-DO 앱의 사용성과 맞지 않음)
