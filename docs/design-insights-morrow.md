# 디자인 인사이트 — Morrow (+ Trello 구조)

- 출처: https://www.awwwards.com/sites/morrow-chat-with-your-todos (Honorable Mention, 2024-01-05, Snow Fox Studio)
- 원본 사이트 morrow.to는 2026-10-07 기준 **접속 불가**(/lander 파킹 페이지로 리다이렉트). 그래서 Awwwards 갤러리 스크린샷 7장을 근거로 분석했다.
- Awwwards 등록 정보: 색상 `#FAFAFA` / `#2C2C2C`, Next.js, 태그 Clean · Flat · Minimal · UI Design · Bento grid
- 목표 제품: **할 일을 카드로 만드는 웹앱.** 구조는 Trello를 참고하고, 시각 형식은 Morrow를 차용한다.

---

## 1. 한 줄 요약

**"다크 캔버스 위에 파스텔 색 카드들이 메이슨리로 쌓인 보드."**
카드 하나가 체크리스트 하나다. 카드 색으로 묶음을 구분하고, 나머지 UI는 무채색으로 숨긴다.

## 2. 화면 구조 (앱 메인 화면)

```
┌─ 상단 바: 로고 · [CMD+K] 커맨드 · 프로필 ───────────────────┐
│ 프로필 블록  │ Projects / resolutions  [←][→]               │
│ (아바타,     │ ┌Morrow──┐┌Life───┐┌Weitlist┐┌Work───┐ →  가로 스크롤 │
│  링크 아이콘)│ │290 todos││34 todos││17 todos ││12 todos│        │
│              │ │▬▬▬▬───  ││▬▬────  ││▬───    ││▬──     │ 진행 바 │
│ Todos                                                       │
│ ┌Tomorrow┐ ┌Today──┐ ┌Yesterday┐ ┌Dec 30th┐   ← 4열 메이슨리  │
│ │흰색    │ │다크    │ │라벤더    │ │살구     │                 │
│ └────────┘ └───────┘ │          │ └────────┘                 │
│ ┌Dec 29th┐ ┌Dec 28th┐└─────────┘ ┌Dec 26th┐                 │
│ │버터    │ │세이지   │ ┌Dec 27th┐ │살구     │                 │
└──────────────────────────────────────────────────────────────┘
```

- **위: 프로젝트 스트립.** 가로로 스크롤되는 프로젝트 카드다. 각 카드에 아이콘, 이름, 할 일 개수, `default` 배지, **진행률 바**가 있다.
- **아래: 할 일 카드 그리드.** 열 4개짜리 메이슨리 배치이고, 카드 높이는 내용에 따라 달라진다.
- 카드 하나가 **날짜 하나**다(Tomorrow / Today / Yesterday / December 30th…).

## 3. 카드 해부도

```
┌──────────────────────────────────┐
│ ☀ Today                        ⋮ │  ← 아이콘 + 제목(18–20px) + 더보기 메뉴
│   ☰ 5 todos   🗀 5 projects       │  ← 메타(아이콘+숫자, 12px, 흐린 색)
│                                  │
│ ☑ send invite emails         [■] │  ← 체크박스 · 텍스트(15px) · 프로젝트 색 칩
│ ☑ Finish contra account      [■] │
│ ☐ prepare luggage            [■] │
│ + New task                       │  ← 인라인 추가 (카드 안에서 바로)
│                                  │
│            edited Today, 09:46 PM│  ← 수정 시각(우측 정렬, 11px)
└──────────────────────────────────┘
```

- **모서리:** 약 8–10px로 작다. 그림자는 없고, 다크 카드에만 1px 테두리가 있다.
- **프로젝트 칩:** 각 할 일 오른쪽의 작은 폴더 아이콘이다. 색으로 소속 프로젝트를 보여준다.
- **호버:** 할 일 줄에 `✕`(삭제)가 나타난다.
- **긴 텍스트:** 줄바꿈하고, 체크박스는 첫 줄에 맞춘다.
- **링크·첨부:** 링크가 있는 할 일은 밑줄로 표시한다.

## 4. 컬러

| 역할 | 값(근사) | 비고 |
|---|---|---|
| 캔버스(배경) | `#222222` ~ `#2C2C2C` | Awwwards 등록 값 `#2C2C2C` |
| 다크 카드 / 프로젝트 카드 | `#2A2A2A` + 1px `#3A3A3A` 테두리 | |
| 밝은 텍스트 / 밝은 카드 | `#FAFAFA` / `#F0F0F0` | |
| 보조 텍스트 | 흰색 50–60% | 메타, 수정 시각 |
| 카드 파스텔 — 라벤더 | `#CDD5F6` 근사 | |
| 카드 파스텔 — 버터 | `#EEDFA4` 근사 | |
| 카드 파스텔 — 세이지 | `#C4D6C0` 근사 | |
| 카드 파스텔 — 살구 | `#E4A48E` 근사 | |
| 강조(마케팅 헤드라인) | 보라 `#A57CF6` 계열, 무지개 그라데이션 | "different", "colorful" 같은 단어에만 사용 |

- **"Minimal or colorful" 토글:** 사용자가 무채색(흰/다크 카드)과 파스텔(무지개) 모드를 전환할 수 있다. 테마 이름은 crimson, goo, gold, love, marine, default다.
- **파스텔 카드 위 글자색:** 진한 잉크색 `#222`를 써서 대비를 유지한다.

## 5. 타이포그래피

- 폰트는 Awwwards에 명시되어 있지 않다. 형태(기하학적 산세리프, 넓은 o, 둥근 마침표)로 보아 **Plus Jakarta Sans** 계열로 추정한다. Google Fonts에 있다.
- 마케팅 헤드라인: Bold 700, 자간을 좁게(약 -2%) 준다. 강조 단어만 색을 바꾼다.
- 앱 UI: 카드 제목 Medium 500 약 18px, 할 일 Regular 400 약 15px, 메타 약 12px(흐린 색).
- 숫자 표기가 많다(todos 수, projects 수, 진행률, streak).

## 6. 인터랙션 & 기능 패턴

| 패턴 | 설명 |
|---|---|
| **CMD+K 커맨드** | 상단 중앙에 단축키 칩이 있다. 검색과 명령을 한 곳에서 처리한다 |
| **채팅으로 할 일 조작** | 하단 입력창 "Send a command regarding your todos…"와 추천 명령 칩(List todos for yesterday, Add multiple todos, Update theme…) |
| **공유/공개 페이지** | `morrow.to/<handle>`로 공개한다. 완료 수와 streak를 템플릿 문구로 X에 공유한다 |
| **하단 플로팅 바** | 다크 pill 안에 흰 버튼("Share 'morrow")과 아이콘 버튼이 있다 |
| **진행률 바** | 프로젝트 카드 하단에 얇은 바로 표시한다 |
| **인라인 작성** | 카드 안에서 "+ New task"를 눌러 바로 추가한다(모달 없음) |

## 7. Trello vs Morrow — 구조 비교

| | Trello | Morrow | 우리 앱(제안, 미정) |
|---|---|---|---|
| 최상위 | 보드 | 프로젝트 | 보드 = 프로젝트 |
| 묶음 | 리스트(열) — 상태별(할 일/진행/완료) | 카드 — **날짜별** | ⚠ 결정 필요 |
| 단위 | 카드 1장 = 할 일 1개 | 카드 안의 한 줄 = 할 일 1개 | ⚠ 결정 필요 |
| 배치 | 가로 열 + 드래그 앤 드롭 | 메이슨리 그리드 | Morrow식 그리드 + Trello식 드래그 |
| 상세 | 카드 클릭 → 상세 모달(설명, 체크리스트, 라벨, 마감일) | 없음(한 줄 텍스트) | |
| 색 | 라벨 색 | 카드 전체 배경 파스텔 | 카드 배경 파스텔 |

## 8. 바로 쓸 수 있는 CSS 토큰 초안

```css
:root {
  --canvas: #242424;
  --surface: #2c2c2c;
  --surface-border: #3a3a3a;
  --text: #fafafa;
  --text-muted: rgb(250 250 250 / 0.55);
  --ink: #222222;              /* 파스텔 카드 위 글자 */

  --card-white:    #f0f0f0;
  --card-lavender: #cdd5f6;
  --card-butter:   #eedfa4;
  --card-sage:     #c4d6c0;
  --card-apricot:  #e4a48e;

  --accent: #a57cf6;

  --font: "Plus Jakarta Sans", "Pretendard", "Noto Sans KR", system-ui, sans-serif;
  --radius-card: 10px;
  --radius-chip: 6px;
  --radius-pill: 999px;
  --gap-grid: 16px;
}
```

## 9. 차용하지 않을 것

- Morrow 로고·마스코트, 카피 문구, 가격표
- AI 채팅 기능 자체 (형식은 참고만 한다. 도입 여부는 DECISIONS에서 정한다)
