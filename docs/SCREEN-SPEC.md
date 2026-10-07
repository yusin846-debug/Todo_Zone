# SCREEN-SPEC

용어는 [GLOSSARY.md](../GLOSSARY.md), 기능과 수용 기준은 [PRD.md](PRD.md), 결정 근거는 [DECISIONS.md](DECISIONS.md)의 ID를 따른다.
시각 시안: [mockups/board.html](mockups/board.html) (확인용이다. 구현은 step11-2에서 `frontend/`에 다시 만든다).
디자인 언어: 사용자의 사이트 **채운(chaeun)**의 타이포그래피·색·태그 형식을 차용한다 (D-056).

---

## 1. 디자인 토큰

### 1.1 색 (D-057)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--canvas` | `#252722` | 페이지 배경 (올리브 블랙) |
| `--surface` | `#30332d` | 버튼 면, Done Card, 패널, 대화상자, 자리표시 |
| `--line` | `#3d4038` | 구분선, 다크 면 테두리 |
| `--paper` | `#f3f0e8` | 다크 면 위 기본 글자, 흰 pill 버튼 배경 |
| `--paper-muted` | `#a9ab9f` | 다크 면 위 보조 글자 |
| `--ink` | `#252722` | 색 Card 위 글자, Overdue 배지 배경, Focus 아이콘 칩 |
| `--ink-muted` | `#43463f` | 색 Card 위 보조 글자(메모, 메타) |
| `--c-inbox` | `#f3f0e8` | **Inbox 전용** (크림) |
| `--c-mist` | `#bacdd3` | Project 색 |
| `--c-gold` | `#e0c285` | Project 색 |
| `--c-sage` | `#bccbaa` | Project 색 |
| `--c-salmon` | `#ebaa94` | Project 색 |
| `--danger` | `#ff9b8f` | Overdue 배지 글자, Delete 버튼, 오류 글자 |

**대비 검증 (WCAG 기준 4.5, 2026-10-07 계산)**

| 조합 | 대비 |
|---|---|
| `--ink` on Card 5색 | 7.69 ~ 13.25 ✅ |
| `--ink-muted` on Card 5색 | 4.8 이상 ✅ (`#4a4d45`는 연어색에서 4.39라 `#43463f`로 조정) |
| `--paper` on `--canvas` | 13.25 ✅ |
| `--paper-muted` on `--canvas` / `--surface` | 6.47 / 5.51 ✅ |
| `--danger` on `--ink` | 7.43 ✅ |

### 1.2 타이포그래피 (D-058)

| 토큰 | 폰트 | 크기/행간 | 자간 | 굵기 | 용도 |
|---|---|---|---|---|---|
| `logo` | Bricolage Grotesque | 40 / 1 | -0.065em | 800 | 워드마크 `to-do zone✳` (✳는 300) |
| `hero-light` | Bricolage Grotesque | 64 / 1.02 | -0.055em | 300 | 인사말 1행 |
| `hero-heavy` | Bricolage Grotesque | 64 / 1.02 | -0.055em | 800 | 인사말 2행 |
| `column` | Bricolage Grotesque | 40 / 1 | -0.05em | 300 + 숫자 800 | Status 열 제목 "Todo **4**" |
| `eyebrow` | Bricolage Grotesque | 11 / 1 | +0.2em, 대문자 | 650 | `TUESDAY, OCTOBER 7`, `01 / TO DO` |
| `focus-title` | Bricolage Grotesque | 30 / 1.08 | -0.04em | 650 | Focus Card 제목 |
| `tag` | Bricolage Grotesque | 17 / 1 | -0.02em | 650 | Project 태그 이름 |
| `card-title` | Pretendard | 17 / 1.45 | 0 | 600 | Card 제목 (S는 15) |
| `body` | Pretendard | 14–15 / 1.6 | 0 | 400 | 메모 미리보기, 안내 문구 |
| `meta` | Pretendard | 12 / 1.5 | 0 | 500 | Project 라벨, 날짜, "2 / 5" |
| `button` | Pretendard | 13–14 / 1 | 0 | 600 | 버튼 |

- 폰트 스택: `"Bricolage Grotesque", "Pretendard Variable", system-ui, sans-serif` / `"Pretendard Variable", Pretendard, system-ui, sans-serif`
- 로드: Bricolage Grotesque는 Google Fonts, Pretendard는 jsDelivr (D-044).
- 한글: `word-break: keep-all`, 음수 자간은 영어 디스플레이에만 쓴다. Focus Card 제목처럼 Bricolage에 한글이 들어가면 한글은 Pretendard로 표시된다.

### 1.3 모양·간격·모션

| 항목 | 값 |
|---|---|
| Card 모서리 | 18px (Focus 26px) |
| Project 태그 모서리 | 22px |
| pill | 999px (버튼, 날짜 배지) |
| 간격 | 4 / 8 / 10 / 12 / 16 / 24 / 40 px |
| 그림자, 기울기, 점선 | **쓰지 않는다.** 깊이는 면 색 대비로, 상태는 면·아이콘으로 표현한다 (D-061) |
| 모션 | 150ms ease-out |

### 1.4 아이콘 (D-062)

- 세트: **Lucide** (ISC 라이선스, React는 `lucide-react`), 선 굵기 1.75, 크기 13–22px.
- **Project 아이콘**: Project마다 1개. 아래 25개 중에서 고른다. 새 Project 기본값은 `folder`. Inbox는 `inbox`로 고정.

  `folder` `book-open` `graduation-cap` `briefcase` `laptop` `code` `pen-tool` `palette` `music` `dumbbell` `footprints` `heart` `users` `house` `shopping-bag` `utensils` `wallet` `plane` `car` `gamepad-2` `camera` `sprout` `star` `coffee` `gimbap`

  `gimbap`은 Lucide에 없어서 직접 그렸다 (D-078). 24×24, Lucide와 같은 둥근 선 끝. 김 테두리는 굵은 선(3), 속재료 6개는 채운 도형이다. 단, 16px 이하에서는 속재료의 세부 모양이 뭉개진다.
- **상태 아이콘** (앱이 자동으로 붙임, D-063):

  | 상황 | 아이콘 |
  |---|---|
  | Due date = 오늘 | `sun` |
  | Overdue | `alert-circle` (어두운 배지) |
  | 그 외 Due date | `calendar` |
  | Done | `check` (Project 색 원 안) |

### 1.5 모션: "물방울" (D-079, D-082)

움직이는 것은 모두 물방울처럼: **탄성 있게 넘쳤다가 자리 잡고**, 누르면 **눌렸다가** 돌아오고, 새로 생기는 것은 **동그랗게 맺혔다가** 퍼진다. 출렁임은 한 번만, 과하면 오류처럼 보인다 (D-061).

| 토큰 (`frontend/src/lib/motion.ts`) | 값 | 쓰는 곳 |
|---|---|---|
| `droplet` | spring, stiffness 420, damping 22, mass 0.9 | 선택 표시 이동, 팝오버 맺힘, 막대 자라남 |
| `settle` | spring, stiffness 260, damping 28 | 패널 미끄러짐, 화면 전환 |
| `press` | 누를 때 scale 0.94 → 놓으면 droplet으로 복귀 | 버튼, 토글, 칩 |
| `bloom` | scale 0.6 · 모서리 둥글게 → 1 · 원래 모서리 | 팝오버(목록, 달력) 등장 |
| `drip` | 위에서 6px, 0.04초 간격으로 차례로 | 목록 항목 등장 |

- 운영체제의 "동작 줄이기"를 켜면 모든 모션을 끄고 바로 바뀐다 (`MotionConfig reducedMotion="user"`).
- Board의 Card 드래그는 dnd-kit이 움직이므로 여기 모션을 섞지 않는다.

---

## 2. 문구 규칙 (D-007)

| 영역 | 언어 | 예 |
|---|---|---|
| 화면 타이틀, 인사말, Status, eyebrow, 필드 라벨 | 영어 | Good morning., Todo, `01 / TO DO`, Title |
| 버튼 | 영어 | + New card, + New project, Save, Cancel, Delete, Close |
| 요약·안내·오류·확인 문장 | 한글 | 아래 4. 문구표 |
| 날짜 (Card) | 한글 | 오늘, 내일, 어제, 10월 9일 (목) |
| `aria-label` | 한글 | "패널 닫기", "Done 열 접기" |

---

## 3. 화면

### S1. Board (메인) — F1, F2, F4, F5, F6, F9

**데스크톱 (≥ 1024px)**

```
┌──────────────────────────────────────────────────────────────────┐
│ to-do zone✳                                    One card at a time.│ ← Header (아래 1px 선)
│                                                                  │
│ TUESDAY, OCTOBER 7                                               │ ← eyebrow
│ Good morning.                          진행 중인 카드 2장, 오늘 마감 1장 │ ← Hero
│ Let's move cards.                      지난 마감 2장이 기다리고 있어요.  │
│                                                                  │
│ [📥 Inbox] [📖 학교] [🛍 개인] [👣 운동] [👥 동아리] (+ New project) │ ← Project 태그
│  1 / 3 ▬─   2 / 5 ▬─  …                                           │
│                                                                  │
│ 01 / TO DO      (+New card) 02 / IN PROGRESS (+New card) 03 / FINISHED (▴)│
│ Todo 4                      Doing 2                    Done 6    │
│ ───────────────             ─────────────────────      ───────── │
│ [L Card]                    [Focus Card       ]        [✓ row]   │
│ [M Card]                    [L Card           ]        [✓ row]   │
│ [S Card]                                                         │
└──────────────────────────────────────────────────────────────────┘
       1        :        1.35        :        0.85   (열 폭, D-060)
```

**Header**
- 왼쪽 워드마크 `to-do zone✳` (`logo`, 소문자, D-059). 오른쪽에 `One card at a time.`. 아래 1px `--line`.

**Hero (D-064)**
- eyebrow: 오늘 날짜를 영어 대문자로 (`TUESDAY, OCTOBER 7`).
- 인사말 2행: 1행은 시간대별 — 05–11시 `Good morning.` / 12–17시 `Good afternoon.` / 그 외 `Good evening.`, 2행은 `Let's move cards.` 고정.
- 오른쪽 요약 문장(한글, `--paper-muted`, 숫자만 `--paper` 굵게): Board 전체 기준(필터와 무관).
  - "진행 중인 카드 **n장**, 오늘 마감 **n장**" + Overdue가 있으면 "지난 마감 **n장**이 기다리고 있어요."
  - 모두 0이면 S-0 문구.

**Project 태그 (F9)**
- Project 색 면, 모서리 22px, 최소 폭 112px. 내용: 아이콘 + 이름(`tag`), "Done 수 / 전체 수"(`meta`), Progress 바(3px, `--ink` / 바탕 `--ink` 15%).
- Inbox가 맨 앞, 나머지는 만든 순서. 줄이 넘치면 다음 줄로 감싼다(데스크톱).
- 마지막에 `+ New project` (테두리 `--line` pill) → S3.
- 클릭하면 필터. 필터가 켜지면 **선택되지 않은 태그가 45% 불투명도**로 물러난다. 다시 누르면 해제 (D-033).

**Status 열**
- 열 머리: eyebrow `01 / TO DO`·`02 / IN PROGRESS`·`03 / FINISHED`, 그 아래 `column` 제목 + 개수. 오른쪽에 `+ New card` 버튼(`--surface` pill). Done 열은 `+ New card` 옆에 접기 버튼(▴/▾).
- 머리 아래 1px `--line`. 열 폭 비율 1 : 1.35 : 0.85. Card 간격 12px.
- 열이 300px보다 좁으면(패널이 열려 Board가 줄었을 때 등) `+ New card`는 `+` 아이콘만 남긴다. 버튼과 제목이 두 줄로 접히지 않게 한다 (D-061).
- Done 열 접힘: 머리만 남고 Card가 숨는다. 상태는 localStorage에 기억 (D-045).
- **Done 열에는 이번 분기에 끝낸 Card만** 보인다. 열 개수와 Project Progress도 Board에 보이는 Card 기준이다 (D-072, D-075). 지난 분기 Card는 Quarterly Review(11-7)에서 본다.

**Card 크기 단계 (D-060)** — 내용으로 자동 결정된다. 사용자가 고르지 않는다.

| 단계 | 조건 | 구성 |
|---|---|---|
| **Focus** | Doing 열의 맨 위 Card (필터 중이면 보이는 것 중 맨 위) | 큰 어두운 아이콘 칩(44px) + Project 라벨 / `focus-title` 제목 / 메모 미리보기 3줄 / 메타. 모서리 26px, 안쪽 여백 26px |
| **L** | 메모가 있음 | 아이콘 칩(30px) + Project 라벨 / 제목(최대 3줄) / 메모 미리보기(최대 3줄) / 메타 |
| **M** | 메모 없음 + Due date 있음 | 아이콘 칩 + 제목 한 행 / 메타(날짜 배지 + Project 이름) |
| **S** | 메모 없음 + Due date 없음 | 아이콘 칩(26px) + 제목 한 행. 여백 14×18 |
| **Done** | Status = Done (단계 무관) | `--surface` 면 + Project 색 원 안 ✓ + `--paper-muted` 제목, 취소선 |

- 메타의 날짜 배지: 상태 아이콘 + 한글 날짜, `--ink` 8% 바탕 pill. Overdue면 `--ink` 바탕 + `--danger` 글자.
- Card 배경은 Project 색. Card 전체가 버튼이며, `aria-label`에 Project 이름을 포함한다(S단계는 이름이 화면에 안 보이므로).

**새 Card 입력 (F2)**
- `+ New card`를 누르면 그 열 맨 위에 입력칸이 열린다(`--surface` 면, `--paper` 1px 테두리, 실선).
- Enter: 만들기, 입력칸 유지(연속 입력). **`isComposing` 중 Enter는 무시.** 빈 제목·공백만 있으면 아무 일도 없음. 100자에서 입력 멈춤.
- Esc 또는 바깥 클릭: 취소.

**드래그 (F4, D-061)**
- 집은 Card: 그대로의 색·모양에 `scale(1.02)`, 커서 `grabbing`. **회전하지 않는다.**
- 놓일 자리: 집은 Card와 같은 높이의 `--surface` 면(실선, 테두리 없음).
- 키보드: Card 포커스 → Space로 집기 → 방향키 → Space로 놓기.
- 놓으면 즉시 반영, 저장 실패 시 되돌리고 T1 토스트 (D-038).

**모바일 (≤ 600px)**
- 좌우 여백 16px. 로고 28px, Hero 40px, 요약 문장은 인사말 아래로.
- Project 태그는 한 줄 가로 스크롤.
- Status 열은 화면 폭 85%, 가로로 넘겨 본다(scroll-snap, `scroll-padding-inline: 16px`). 열 폭 비율은 적용하지 않는다.
- 드래그 없음. 이동은 S2의 Status로 한다 (D-021).

### S2. Card 상세 패널 — F3, F4(모바일), F7

```
┌ CARD ──────────────────── (Close ✕) ┐
│ TITLE                               │
│ [알고리즘 중간고사 범위 정리하고      ]│ ← 여러 줄, 내용만큼 늘어남
│ [기출문제 3년치 풀어보기             ]│
│                            31 / 100 │
│ MEMO                                │
│ [                                  ]│
│                          45 / 2,000 │
│ DUE DATE            STATUS          │
│ [📅 10월 6일 (월) ✕] [Todo ▾]        │
│ PROJECT                             │
│ [📖 학교 ▾]                          │
│ (Delete)                    (Save)  │
└─────────────────────────────────────┘
```

- 데스크톱: 오른쪽 고정 폭 400px, `--surface`, 왼쪽 1px `--line`. Board는 그만큼 좁아져서 계속 보인다 (D-047). 모바일: 전체 화면 시트.
- 필드 라벨은 `eyebrow` 스타일. 입력칸은 `--canvas` 바탕, `--line` 테두리, 모서리 12px.
- **선택 칸은 직접 만든 부품이다 (D-080).** 브라우저 기본 부품은 애니메이션을 넣을 수 없고 언어 설정에 따라 `mm/dd/yyyy`처럼 보인다.
  - **Status**: `Todo · Doing · Done` 3칸 토글. 선택 표시가 물방울처럼 흘러 이동한다. 방향키로 바꿀 수 있다.
  - **Project**: 누르면 맺히는(bloom) 목록. 항목마다 색 점 + 아이콘 + 이름. 방향키·Enter·Esc. 아래 공간이 모자라면 위로 열린다(패널 아래쪽에서 잘리지 않게).
  - **Due date**: "10월 14일 (수)" 또는 "날짜 없음". 누르면 빠른 선택(`오늘`, `내일`, `금요일`(오늘 이후 가장 가까운 금요일), `다음 주 월`, `지우기`)과 한글 미니 달력이 맺힌다. 달을 넘기면 좌우로 미끄러지고, 선택한 날의 동그라미가 새 날짜로 흘러간다.
- Title: 여러 줄 자동 높이, "n / 100". Memo: 최소 120px, "n / 2,000". Due date: 날짜 선택 + `✕`로 지우기. Status: Todo/Doing/Done(바꾸면 그 열 맨 위로). Project: 아이콘 + 이름 목록.
- 버튼: `Save`(`--paper` pill, 제목이 비었거나 바뀐 내용이 없으면 비활성. 제목이 비면 V1), `Delete`(`--danger` 글자, D1), `Close ✕`(변경이 있으면 D2).

### S3. Projects 관리 — F8

- Project 태그 줄 끝의 `+ New project`로 연다. 새 이름 입력칸에 포커스가 간다. S2와 같은 자리(400px 패널 / 모바일 시트).

```
┌ PROJECTS ───────────────── (Close ✕) ┐
│ (📥) Inbox                       🔒  │
│ (📖) 학교          [색] [아이콘] [🗑] │
│ (👣) 운동          [색] [아이콘] [🗑] │
│ (+ New project)              5 / 20  │
└──────────────────────────────────────┘
```

- 목록: Inbox 맨 위(자물쇠), 나머지는 만든 순서. 각 행 앞에 Project 색 원 + 아이콘.
- 새 Project: 이름 입력 후 Enter. 색은 4색(mist → gold → sage → salmon)을 순서대로 자동, 아이콘은 `folder` (D-042, D-062). 20개면 비활성 + V3.
- 이름: 클릭해서 바로 편집. 앞뒤 공백 제거 후 1~30자 (D-065). Enter 저장 / Esc 취소. 중복이면 V2.
- 색: 4색 팔레트(크림은 고를 수 없음). 아이콘: 25개 격자(5×5)에서 선택.
- 삭제: 🗑 → D3.

### S5. Quarterly Review — F10, F11 (D-074, D-081)

- **들어가기:** 헤더 가운데의 `Board / Review` 토글(선택 표시가 물방울처럼 이동). 주소 `#review`, 새로고침해도 유지. 화면은 settle 스프링으로 교차 전환.

```
┌──────────────────────────────────────────────────────────────┐
│ to-do zone✳            [ Board | Review ]   One card at a time.│
│                                                              │
│ ‹  2026 Q3   2026 Q4  ›                                       │ ← 분기 이동 (기록 있는 분기 + 이번 분기)
│ This quarter.                                                │
│ 8 cards done.                         ← 숫자가 0부터 올라간다   │
│                                                              │
│ BY PROJECT                                                   │
│ 🎓 학습        ▬▬▬▬▬▬▬▬▬▬  3          ← 막대가 droplet으로 자람 │
│ 💼 커리어      ▬▬▬▬▬▬      2                                   │
│                                                              │
│ FINISHED                                                     │
│ 🎓 학습                                                       │
│   ✓ Python 실행환경 설치 상태 확인        10월 7일  (Reopen)    │
└──────────────────────────────────────────────────────────────┘
```

- **분기 이동:** `‹ ›`와 분기 이름 칩. 이전 분기로 가면 내용이 왼쪽에서, 다음 분기로 가면 오른쪽에서 들어온다. 이번 분기 제목은 `This quarter.`, 지난 분기는 `2026 Q3.`
- **큰 숫자:** `{n} cards done.` (1장이면 `card`). Hero와 같은 300/800 두 줄 구성.
- **By project:** 완료 수가 많은 순. 막대 길이 = 그 Project 완료 수 ÷ 가장 많은 Project 완료 수. 막대 색은 Project 색, 0.06초 간격으로 차례로 자란다.
- **Finished:** Project별로 묶고, 각 줄에 ✓ + 제목 + 완료 날짜(한글). 줄은 drip으로 차례로 나타난다.
- **Reopen (D-073):** 지난 분기 카드에만 보인다. 누르면 그 줄이 물방울처럼 줄어들며 사라지고, 카드는 Todo 맨 위로 간다. 이번 분기 카드는 Board에서 옮기면 된다.
- **빈 분기:** "이 분기에는 끝낸 카드가 없어요."

### S4. 상태 화면

| 상태 | 표시 |
|---|---|
| 로딩 (첫 진입) | 각 열에 `--surface` 면 자리표시 2장(높이 다르게: 120px, 64px), 1.2s 밝기 변화 |
| 빈 Board | Todo 열에 E1 |
| 빈 열 | 열 안에 `--paper-muted` E2 |
| 필터 결과 없음 | 각 열에 E3 |
| 서버 연결 실패 (첫 진입) | Board 대신 가운데 E4 + `Retry` |
| 저장 실패 (작업 중) | 아래 가운데 토스트 T1(`--surface` pill, 4초), 낙관적 변경 되돌림 |

---

## 4. 문구표

| ID | 상황 | 문구 |
|---|---|---|
| S-0 | Hero 요약, 모두 0 | 오늘은 여유로운 날이에요. |
| E1 | 빈 Board | 아직 카드가 없어요. **+ New card**로 첫 카드를 만들어 보세요. |
| E2 | 빈 열 | 비어 있어요 |
| E3 | 필터 결과 없음 | 이 Project에는 아직 카드가 없어요 |
| E4 | 서버 연결 실패 | 서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요. |
| T1 | 저장 실패 | 저장하지 못했어요. 잠시 후 다시 시도해 주세요. |
| V1 | 빈 제목 | 제목을 입력해 주세요. |
| V2 | Project 이름 중복 | 이미 같은 이름의 Project가 있어요. |
| V3 | Project 20개 | Project는 20개까지 만들 수 있어요. |
| V4 | Inbox 수정 시도 | Inbox는 바꾸거나 삭제할 수 없어요. |
| V5 | Project 이름 길이 | Project 이름은 30자까지 쓸 수 있어요. |
| D1 | Card 삭제 확인 | 이 카드를 삭제할까요? 삭제하면 되돌릴 수 없어요. — `Cancel` / `Delete` |
| D2 | 저장 안 한 채 닫기 | 저장하지 않은 변경이 있어요. 닫을까요? — `Cancel` / `Close` |
| D3 | Project 삭제 확인 | '{이름}' Project를 삭제할까요? 카드 {n}장은 Inbox로 옮겨져요. — `Cancel` / `Delete` |

**확인 대화상자:** 가운데, `--surface`, 모서리 22px, 뒤 배경 검정 60%. 기본 포커스는 `Cancel`.

---

## 5. 접근성

- Tab 순서: Header → Project 태그 → Todo → Doing → Done → 패널.
- 포커스 표시: 2px `--paper` 외곽선, 2px 간격.
- 색만으로 정보를 전달하지 않는다: Project는 색 + 아이콘 + 이름(`aria-label`), Overdue는 배지 + 아이콘.
- 장식 아이콘은 `aria-hidden="true"`.
- 패널·대화상자: 열면 포커스를 안으로, 닫으면 연 버튼으로 돌려준다.

---

## 6. PRD 대응표

| PRD | 화면·요소 |
|---|---|
| F1 Board 보기 | S1 Status 열·개수, Hero 요약, Card 크기 단계, S4 |
| F2 Card 만들기 | S1 새 Card 입력 |
| F3 상세·수정 | S2 |
| F4 옮기기 | S1 드래그·키보드, 모바일 S2 Status, T1 |
| F5 완료 | S1 Done 단계, Done 접기 |
| F6 Due date/Overdue | 날짜 배지, 상태 아이콘 |
| F7 삭제 | S2 Delete, D1 |
| F8 Project 관리 | S3 (색, 아이콘, 30자), V2–V5, D3 |
| F9 필터·Progress | S1 Project 태그, E3 |
