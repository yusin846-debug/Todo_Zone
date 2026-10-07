# SCREEN-SPEC

용어는 [GLOSSARY.md](../GLOSSARY.md), 기능과 수용 기준은 [PRD.md](PRD.md), 결정 근거는 [DECISIONS.md](DECISIONS.md)의 ID를 따른다.
시각 시안: [mockups/board.html](mockups/board.html) (확인용이다. 구현은 step11-2에서 `frontend/`에 다시 만든다).

---

## 1. 디자인 토큰

### 1.1 색

| 토큰 | 값 | 용도 |
|---|---|---|
| `--canvas` | `#232323` | 페이지 배경 |
| `--surface` | `#2c2c2c` | Project 타일, 상세 패널, 대화상자 |
| `--surface-border` | `#3a3a3a` | 다크 면의 1px 테두리, 점선 |
| `--text` | `#fafafa` | 다크 면 위 기본 글자, 흰 pill 버튼 배경 |
| `--text-muted` | `#a7a7a7` | 다크 면 위 보조 글자 |
| `--ink` | `#222222` | 파스텔 Card 위 글자, Overdue 배지 배경 |
| `--ink-muted` | `#555555` | 파스텔 Card 위 메타 글자, Done Card 제목 |
| `--card-inbox` | `#f0f0f0` | **Inbox 전용** (D-032, D-042) |
| `--card-lavender` | `#cdd5f6` | Project 색 |
| `--card-butter` | `#eedfa4` | Project 색 |
| `--card-sage` | `#c4d6c0` | Project 색 |
| `--card-apricot` | `#f2c1ae` | Project 색 (D-046에서 대비 때문에 밝게 조정) |
| `--danger` | `#ff9b8f` | Overdue 배지 글자, 삭제 버튼, 오류 글자 |

**대비 검증 (WCAG, 2026-10-07 계산)**

| 조합 | 대비 | 기준 4.5 |
|---|---|---|
| `--ink` on 파스텔 5색 | 9.86 ~ 13.96 | ✅ |
| `--ink-muted` on 파스텔 5색 | 4.62 ~ 6.54 | ✅ |
| `--text` on `--canvas` | 15.06 | ✅ |
| `--text-muted` on `--canvas` / `--surface` | 6.53 / 5.80 | ✅ |
| `--danger` on `--ink` (Overdue 배지) | 7.83 | ✅ |
| `--danger` on `--surface` | 6.87 | ✅ |

### 1.2 타이포그래피 (D-043)

| 토큰 | 폰트 | 크기/행간 | 자간 | 굵기 | 용도 |
|---|---|---|---|---|---|
| `display` | Inter Tight | 28 / 28 | -1px | 400 | Status 열 제목 (Todo, Doing, Done) |
| `wordmark` | Inter Tight | 28 / 28 | -1px | 500 | TO-DO ZONE (모바일 22/22) |
| `card-title` | Pretendard | 16 / 1.5 | 0 | 500 | Card 제목 (최대 3줄, 넘으면 말줄임) |
| `panel-title` | Pretendard | 20 / 1.5 | 0 | 500 | 상세 패널의 제목 입력 |
| `body` | Pretendard | 15 / 1.5 | 0 | 400 | 메모, 입력, 안내 문구 |
| `label` | Inter Tight | 12–13 / 1 | 0 | 500 | 섹션·필드 라벨 (Projects, Title, Memo …) |
| `meta` | Pretendard | 12 / 1.5 | 0 | 400 | Due date, Project 이름, "2 / 5" |
| `button` | Pretendard | 14 / 1 | 0 | 500 | 버튼 |

- 폰트 스택: `"Inter Tight", "Pretendard Variable", Pretendard, system-ui, sans-serif` (영어 타이틀) / `"Pretendard Variable", Pretendard, system-ui, sans-serif` (본문). 한글은 Pretendard로 표시된다.
- 로드: Inter Tight는 Google Fonts, Pretendard는 jsDelivr (D-044).
- 한글 규칙: `word-break: keep-all`, 본문 행간 1.5, 한글에는 음수 자간을 쓰지 않는다.

### 1.3 간격·모서리·모션

| 토큰 | 값 |
|---|---|
| 간격 | 4 / 8 / 12 / 16 / 20 / 24 / 32 px (`--space-1`~`--space-8`) |
| `--radius-card` | 10px (Card, Project 타일, 입력칸 8px) |
| `--radius-panel` | 16px (대화상자) |
| `--radius-pill` | 999px (버튼, 배지) |
| 그림자 | 쓰지 않는다. 깊이는 면 색 대비로만 표현한다 (D-008) |
| 모션 | 150ms ease-out (패널 열기, Done 접기, Card 추가·삭제) |

---

## 2. 문구 규칙 (D-007)

| 영역 | 언어 | 예 |
|---|---|---|
| 화면·섹션 타이틀, Status, 필드 라벨 | 영어 | Board, Projects, Todo, Title, Memo, Due date |
| 버튼 | 영어 | + New card, Save, Cancel, Delete, Close, New project |
| 안내·오류·확인 문장 | 한글 | 아래 4. 문구표 |
| 날짜 | 한글 | 오늘, 내일, 어제, 10월 9일 (목) |
| 접근성 라벨(`aria-label`) | 한글 | "패널 닫기", "Done 열 접기" |

---

## 3. 화면

### S1. Board (메인) — F1, F2, F4, F5, F6, F9

**데스크톱 (≥ 1024px)**

```
┌────────────────────────────────────────────────────────────────┐
│ TO-DO ZONE                                        (Projects)   │ ← Header
│ Projects                                                       │
│ [● Inbox 1/3 ▬──] [● 학교 2/5 ▬▬─] [● 개인 0/2 ───] [+]  →      │ ← Project 줄 (가로 스크롤)
│                                                                │
│ Todo 4              Doing 2              Done 6          ▴     │ ← Status 열 제목 + 개수
│ ┌ + New card ─────┐ ┌ + New card ─────┐ ┌ + New card ─────┐    │
│ ┌ Card ───────────┐ ┌ Card ───────────┐ ┌ Card(흐림) ─────┐    │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘    │
└────────────────────────────────────────────────────────────────┘
```

- **Header:** 왼쪽 wordmark, 오른쪽 `Projects` 버튼 (S3을 연다).
- **Project 줄:** Inbox가 항상 맨 앞이고, 나머지는 만든 순서다. 타일 폭은 200px이고 넘치면 가로로 스크롤된다. 마지막에 `+` 타일이 있다(S3의 새 Project 만들기로 바로 간다).
  - 타일 내용: 색 점, 이름, "Done 수 / 전체 수", Progress 바(3px).
  - 클릭하면 필터가 켜진다. 선택된 타일은 테두리가 `--text`가 된다. 다시 누르면 해제된다 (D-033).
  - 필터가 켜져 있으면 Board에는 그 Project의 Card만 보이고, 열 제목의 개수도 필터 기준으로 바뀐다.
- **Status 열:** 3개 열이 같은 폭(1fr)이다. 열 사이 간격은 16px이다.
  - 열 제목은 `display` 토큰을 쓰고, 옆에 Card 수를 `--text-muted`로 표시한다.
  - 열 맨 위에 `+ New card`(점선 테두리)가 있다.
  - Done 열 제목 오른쪽에 접기 버튼(▴/▾)이 있다. 접으면 열 제목과 개수만 남는다. 접힘 상태는 브라우저(localStorage)에 기억한다 (D-045).
- **Card:** 소속 Project 색 배경, 모서리 10px, 안쪽 여백 16px.
  - 제목(`card-title`, 최대 3줄).
  - 메타 줄: Due date, Project 이름. Due date가 없으면 Project 이름만 보인다.
  - Overdue면 Due date가 **어두운 배지**(`--ink` 배경, `--danger` 글자)로 바뀐다. 카드 색과 상관없이 똑같이 보인다.
  - Done Card는 제목이 `--ink-muted`로 흐려진다. Overdue 배지는 표시하지 않는다.
  - 클릭하면 S2가 열린다.

**새 Card 입력 (F2)**
- `+ New card`를 누르면 그 자리가 입력칸으로 바뀐다(테두리가 실선 `--text`).
- Enter: 만들기. 입력칸은 그대로 남아서 연속으로 입력할 수 있다. **`isComposing` 중의 Enter는 무시한다.**
- Esc 또는 입력칸 밖 클릭: 취소. 입력 중이던 내용은 버린다.
- 빈 제목이나 공백만 있는 제목에서는 Enter를 눌러도 아무 일도 일어나지 않는다.
- 100자에 도달하면 더 입력되지 않는다.

**드래그 (F4, dnd-kit)**
- 드래그 중인 Card는 2도 기울어지고 흰 외곽선이 생긴다. 놓일 자리에는 점선 슬롯이 보인다.
- 키보드로도 옮길 수 있다: Card에 포커스 → Space로 집기 → 방향키로 이동 → Space로 놓기 (dnd-kit 키보드 센서).
- 놓으면 즉시 반영되고, 저장에 실패하면 원래 자리로 돌아가며 토스트가 뜬다 (D-038).

**모바일 (≤ 600px)**
- 여백 16px, wordmark 22px, Project 타일 폭 150px.
- Status 열은 화면 폭의 85%이고, **가로로 넘겨** 본다(scroll-snap). 다음 열이 오른쪽에 살짝 보여서 넘길 수 있다는 걸 알려준다.
- 드래그는 쓰지 않는다. Card를 옮길 때는 S2의 Status를 바꾼다 (D-021).

### S2. Card 상세 패널 — F3, F4(모바일), F7

```
┌ Card ─────────────────── (Close ✕) ┐
│ Title                              │
│ ┌────────────────────────────────┐ │
│ │ 알고리즘 중간고사 범위 정리하고  │ │ ← 여러 줄, 내용만큼 늘어남
│ │ 기출문제 3년치 풀어보기          │ │
│ └────────────────────────────────┘ │
│                           31 / 100 │
│ Memo                               │
│ ┌────────────────────────────────┐ │
│ │                                │ │
│ └────────────────────────────────┘ │
│                          45 / 2,000│
│ Due date          Status           │
│ [10월 6일 (월) ✕] [Todo ▾]          │
│ Project                            │
│ [● 학교 ▾]                          │
│                                    │
│ (Delete)                   (Save)  │
└────────────────────────────────────┘
```

- **데스크톱:** 오른쪽에 고정된 폭 400px 패널이다(`--surface`, 왼쪽 1px 테두리). 열려 있는 동안 Board는 패널 폭만큼 좁아져서 계속 보인다 (D-047).
- **모바일:** 화면 전체를 덮는 시트로 열린다.
- **필드**
  - Title: 여러 줄 입력, 내용만큼 높이가 늘어난다. 아래에 "n / 100".
  - Memo: 여러 줄 입력, 최소 높이 120px. 아래에 "n / 2,000".
  - Due date: 날짜 선택기. 값이 있으면 `✕`로 지울 수 있다. 표시 형식은 "10월 6일 (월)".
  - Status: Todo / Doing / Done 선택. 바꾸면 그 열의 맨 위로 간다.
  - Project: 색 점 + 이름 목록에서 선택.
- **버튼:** `Save`(흰 pill, 주요 동작), `Delete`(`--danger` 글자), `Close ✕`.
  - Save: 제목이 비어 있으면 비활성화되고, 제목 칸 아래에 안내 문구가 뜬다.
  - Close/Esc: 저장하지 않은 변경이 있으면 확인 대화상자(D2)를 띄운다.
  - Delete: 확인 대화상자(D1)를 띄운다.

### S3. Projects 관리 — F8

- Header의 `Projects` 버튼이나 Project 줄의 `+`로 연다. S2와 같은 자리(오른쪽 400px 패널, 모바일은 전체 시트)에 열린다.

```
┌ Projects ─────────────── (Close ✕) ┐
│ ● Inbox                       🔒   │ ← 이름·색·삭제 불가
│ ● 학교            [색] [이름] [🗑] │
│ ● 개인            [색] [이름] [🗑] │
│ ...                                │
│ (+ New project)          4 / 20    │
└────────────────────────────────────┘
```

- **목록:** Inbox가 맨 위에 자물쇠 아이콘과 함께 있고, 나머지는 만든 순서다.
- **새 Project:** 이름을 입력하고 Enter. 색은 4색(라벤더 → 버터 → 세이지 → 살구)을 순서대로 돌아가며 자동 지정된다 (D-042).
  - 20개가 되면 `+ New project`가 비활성화되고 "Project는 20개까지 만들 수 있어요."가 보인다.
- **이름 변경:** 이름을 클릭하면 바로 편집된다. Enter로 저장하고 Esc로 취소한다. 중복이면 저장되지 않고 오류 문구가 보인다.
- **색 변경:** 색 점을 누르면 4색 팔레트가 나타난다. 흰색은 고를 수 없다.
- **삭제:** 휴지통 → 확인 대화상자(D3).

### S4. 상태 화면

| 상태 | 표시 |
|---|---|
| **로딩** (첫 진입) | 각 열에 회색 카드 모양 자리표시 2장(`--surface`, 깜빡임 애니메이션 1.2s) |
| **빈 Board** (Card 0장) | Todo 열에 안내 문구 E1, 다른 열은 비워 둔다 |
| **빈 열** | 열 안에 `--text-muted` 문구 E2 |
| **필터 결과 없음** | 각 열에 E3 |
| **서버 연결 실패** (첫 진입) | Board 대신 가운데에 E4 + `Retry` 버튼 |
| **저장 실패** (작업 중) | 화면 아래 가운데에 토스트 T1 (4초 뒤 사라짐). 낙관적 변경은 되돌린다 |

---

## 4. 문구표

| ID | 상황 | 문구 |
|---|---|---|
| E1 | 빈 Board | 아직 카드가 없어요. **+ New card**로 첫 카드를 만들어 보세요. |
| E2 | 빈 열 | 비어 있어요 |
| E3 | 필터 결과 없음 | 이 Project에는 아직 카드가 없어요 |
| E4 | 서버 연결 실패 | 서버에 연결할 수 없어요. 서버가 켜져 있는지 확인해 주세요. |
| T1 | 저장 실패 | 저장하지 못했어요. 잠시 후 다시 시도해 주세요. |
| V1 | 빈 제목 | 제목을 입력해 주세요. |
| V2 | Project 이름 중복 | 이미 같은 이름의 Project가 있어요. |
| V3 | Project 20개 | Project는 20개까지 만들 수 있어요. |
| V4 | Inbox 수정 시도 | Inbox는 바꾸거나 삭제할 수 없어요. |
| D1 | Card 삭제 확인 | 이 카드를 삭제할까요? 삭제하면 되돌릴 수 없어요. — `Cancel` / `Delete` |
| D2 | 저장 안 한 채 닫기 | 저장하지 않은 변경이 있어요. 닫을까요? — `Cancel` / `Close` |
| D3 | Project 삭제 확인 | '{이름}' Project를 삭제할까요? 카드 {n}장은 Inbox로 옮겨져요. — `Cancel` / `Delete` |

**확인 대화상자 공통:** 화면 가운데, `--surface`, 모서리 16px, 뒤 배경은 검정 60%. 기본 포커스는 `Cancel`에 둔다(실수로 Enter를 눌러 삭제되는 것을 막기 위해).

---

## 5. 접근성

- 모든 버튼과 Card는 키보드로 접근할 수 있다(Tab 순서: Header → Project 줄 → Todo → Doing → Done → 패널).
- 포커스 표시: 2px `--text` 외곽선, 2px 간격.
- 색만으로 정보를 전달하지 않는다: Card에는 Project 이름을, Overdue에는 배지 모양을 함께 쓴다.
- 패널과 대화상자가 열리면 포커스를 그 안으로 옮기고, 닫으면 연 버튼으로 돌려준다.

---

## 6. PRD 대응표

| PRD | 화면·요소 |
|---|---|
| F1 Board 보기 | S1 Status 열, 열 개수, S4 빈 상태 E1/E2 |
| F2 Card 만들기 | S1 새 Card 입력 (isComposing, Esc, 100자, 필터 Project) |
| F3 상세·수정 | S2 필드, 글자 수, Save 비활성, D2 |
| F4 옮기기 | S1 드래그·키보드 이동, 모바일 S2 Status, T1 되돌리기 |
| F5 완료 | S1 Done 열, Done Card 흐림, 접기(D-045) |
| F6 Due date/Overdue | S1 메타 줄, Overdue 배지, 날짜 표기 |
| F7 삭제 | S2 Delete, D1 |
| F8 Project 관리 | S3, V2/V3/V4, D3 |
| F9 필터·Progress | S1 Project 줄, E3 |
