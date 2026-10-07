# DECISIONS

확정된 결정만 적는다. 결정은 사람이 하고, 각 줄에 결정한 날짜를 남긴다.
되돌리기 어렵고 이유가 중요한 결정은 `docs/adr/`에 따로 기록하고 여기서 링크한다.

| ID | 결정 | 날짜 | 근거 |
|---|---|---|---|
| D-001 | 앱 이름은 **TO-DO ZONE**이다. 앱 안의 용어는 "Card"를 쓰고, "To-do"는 브랜드 이름에만 쓴다 → 워드마크 표기는 D-059 | 2026-10-07 | [GLOSSARY](../GLOSSARY.md) |
| D-002 | 해야 할 일을 카드로 관리하는 **개인용(사용자 1명)** 웹앱이다 | 2026-10-07 | |
| D-003 | 구조는 **Trello**, 시각 형식은 **Morrow**를 참고한다 | 2026-10-07 | [design-insights-morrow](design-insights-morrow.md) |
| D-004 | **카드 1장 = 할 일 1개**다. 용어는 Card로 통일한다 | 2026-10-07 | [ADR-0001](adr/0001-card-is-one-unit-of-work.md) |
| D-005 | 모든 카드는 **정확히 1개의 Project**에 속한다. 지정하지 않으면 **Inbox**에 들어간다 | 2026-10-07 | [GLOSSARY](../GLOSSARY.md) |
| D-006 | **서버 + DB**에 저장하고 **로그인은 없다**. 로컬 실행 전용이다 | 2026-10-07 | [ADR-0002](adr/0002-server-without-login-local-only.md) |
| D-007 | 화면·섹션 타이틀, 열 이름, 주요 버튼은 **영어**로 쓴다. 안내·오류 문장과 사용자 콘텐츠는 **한글**로 쓴다. 디자인은 한글 사용을 전제로 한다 | 2026-10-07 | |
| D-008 | 테마는 **Morrow식 다크 + 파스텔 카드**에 **Readymag의 타이포 규칙**을 더한다. 오렌지 강조색은 쓰지 않는다. 라이트 테마는 MVP 이후로 미룬다 | 2026-10-07 | [morrow](design-insights-morrow.md), [readymag](design-insights-readymag.md) |
| D-009 | MVP에서 **제외**: AI 채팅, 공개 공유 페이지, 협업(여러 사용자). ⌘K 검색은 MVP 이후 후보로 둔다 | 2026-10-07 | 범위 관리 |
| D-010 | Status는 **Todo / Doing / Done** 3개로 고정한다. 사용자가 열을 추가하거나 이름을 바꿀 수 없다 | 2026-10-07 | [ADR-0003](adr/0003-fixed-statuses-done-by-position.md) |
| D-011 | 카드 필드는 **제목(필수), 메모, 마감일, Project** 4개다. 체크리스트와 우선순위는 MVP 이후로 미룬다 | 2026-10-07 | |
| D-012 | **완료 = Status가 Done**이다. 별도의 완료 표시는 없다 | 2026-10-07 | [ADR-0003](adr/0003-fixed-statuses-done-by-position.md) |
| D-013 | 같은 Status 안의 카드 순서는 **사용자가 드래그로** 정한다. 새 카드는 맨 위에 추가된다 | 2026-10-07 | |
| D-014 | **Board는 1개**다. 위쪽 Project 줄로 **필터**하고, Project 줄에 진행률을 표시한다 | 2026-10-07 | |
| D-015 | 카드 삭제는 **확인 창을 띄운 뒤 영구 삭제**한다. Undo는 MVP 이후 후보로 둔다 | 2026-10-07 | |
| D-016 | Project 규칙: 이름 중복 **금지**, 색 중복 **허용**(파스텔 5색). Project를 삭제하면 그 카드는 **Inbox로 이동**한다. Inbox는 삭제와 이름 변경이 불가능하다 → **색 규칙은 D-042로 개정** | 2026-10-07 | [GLOSSARY](../GLOSSARY.md) |
| D-017 | Due date는 **날짜만** 가진다. Overdue 카드는 Due date를 경고색으로 표시하고, Done 카드는 경고하지 않는다. 표기는 "오늘/내일/어제", 그 외 "10월 9일 (목)" | 2026-10-07 | [GLOSSARY](../GLOSSARY.md) |
| D-018 | 카드는 **모든 Status 열** 맨 위의 "+ New card"에서 **제목만** 입력해 만든다. 필터가 켜져 있으면 그 Project에, 아니면 **Inbox**에 넣는다. 메모와 Due date는 상세 패널에서 입력한다 | 2026-10-07 | |
| D-019 | Done 카드는 **전부 표시**하고, Done 열은 **접을 수 있다**. Archive는 MVP 이후 후보로 둔다 → **D-070·D-072로 개정** (분기 아카이브) | 2026-10-07 | |
| D-020 | Progress = Done 카드 수 ÷ 전체 카드 수. 0장이면 0%. "3 / 8"처럼 숫자를 함께 표시하고, Inbox에도 표시한다 | 2026-10-07 | [GLOSSARY](../GLOSSARY.md) |
| D-021 | **데스크톱 우선**, 모바일(375px)에서도 쓸 수 있다. 모바일은 열을 가로로 넘겨 보고, 상세 패널의 Status 변경으로 카드를 옮긴다. 기준 폭은 1024 / 375 | 2026-10-07 | |
| D-022 | AI 작업 규칙은 [AGENTS.md](../AGENTS.md)를 따른다 | 2026-10-07 | |
| D-023 | 언어는 프론트엔드와 백엔드 모두 **TypeScript**로 통일한다 | 2026-10-07 | [ADR-0004](adr/0004-typescript-react-express-sqlite.md) |
| D-024 | 프론트엔드는 **React + Vite**, 드래그는 **dnd-kit**을 쓴다 | 2026-10-07 | [ADR-0004](adr/0004-typescript-react-express-sqlite.md) |
| D-025 | 백엔드는 **Node.js + Express**다 | 2026-10-07 | [ADR-0004](adr/0004-typescript-react-express-sqlite.md) |
| D-026 | DB는 **SQLite**(파일 하나)다 | 2026-10-07 | [ADR-0004](adr/0004-typescript-react-express-sqlite.md) |
| D-027 | 한 저장소 안에 **`frontend/`와 `backend/`**를 나눈다 → **D-037로 개정** (`shared/` 추가) | 2026-10-07 | |
| D-028 | PLAN은 **step 단위 마일스톤**과 마일스톤별 완료 기준으로 쓴다 | 2026-10-07 | [PLAN](PLAN.md) |
| D-029 | 작업 중간중간 **GitHub 저장소에 푸시**한다: [yusin846-debug/Todo_Zone](https://github.com/yusin846-debug/Todo_Zone) (**public**) | 2026-10-07 | |
| D-030 | 저장소에는 `skills-lock.json`만 올리고 `.agents/`, `.claude/skills/`는 올리지 않는다. 스킬은 `npx skills experimental_install`로 다시 설치한다 | 2026-10-07 | |
| D-031 | Card 제목은 최대 **100자**, 메모는 최대 **2,000자**다 | 2026-10-07 | |
| D-032 | Inbox의 Card 색은 **흰색(`#F0F0F0`)으로 고정**한다 | 2026-10-07 | |
| D-033 | Project 필터는 **한 번에 하나**만 선택한다. 같은 Project를 다시 누르면 해제된다 | 2026-10-07 | D-018과 일관 |
| D-034 | Project는 Inbox를 포함해 최대 **20개**다 | 2026-10-07 | |
| D-035 | API는 **REST + JSON**, 경로는 `/api/*`다 | 2026-10-07 | [ARCHITECTURE](ARCHITECTURE.md) |
| D-036 | DB 접근은 **Drizzle ORM + libSQL 클라이언트**로 한다. 로컬은 `file:`, 배포 시 Turso(`libsql://`)로 바꾼다 | 2026-10-07 | [ADR-0005](adr/0005-drizzle-libsql-deploy-ready.md) |
| D-037 | **`shared/`** 폴더(npm workspaces)에 zod 스키마와 타입을 둔다. D-027의 폴더 구조는 `frontend/` + `backend/` + `shared/`로 개정한다 | 2026-10-07 | [ARCHITECTURE](ARCHITECTURE.md) |
| D-038 | 프론트엔드 서버 상태는 **TanStack Query**로 관리한다. Card 이동은 **낙관적 업데이트**로 하고, 실패하면 되돌린다 | 2026-10-07 | [ARCHITECTURE](ARCHITECTURE.md) |
| D-039 | 스타일은 **CSS Modules + CSS 변수(디자인 토큰)**로 한다 | 2026-10-07 | |
| D-040 | 개발은 루트에서 `npm run dev` 한 번으로 실행한다. frontend는 5173, backend는 **127.0.0.1:3000**이고 Vite가 `/api`를 백엔드로 넘긴다(프록시) | 2026-10-07 | [ARCHITECTURE](ARCHITECTURE.md) |
| D-041 | MVP는 **로컬 전용**이다. MVP 이후 **Vercel 배포** 마일스톤을 둔다. 배포 전에 인증을 추가하도록 ADR-0002를 재검토한다 | 2026-10-07 | [ADR-0005](adr/0005-drizzle-libsql-deploy-ready.md) |
| D-042 | 일반 Project는 **4색**(라벤더, 버터, 세이지, 살구)에서만 고른다. **흰색은 Inbox 전용**이다. 새 Project의 색은 4색을 순서대로 돌아가며 자동 지정한다 (D-016 개정) → 색 이름은 D-057로 개정 | 2026-10-07 | [SCREEN-SPEC](SCREEN-SPEC.md) |
| D-043 | 영어 타이틀 폰트는 **Inter Tight**, 한글·본문은 **Pretendard**다 → **D-058로 개정** (Bricolage Grotesque) | 2026-10-07 | [SCREEN-SPEC](SCREEN-SPEC.md) |
| D-044 | Pretendard는 **jsDelivr CDN**, Inter Tight는 Google Fonts에서 불러온다 | 2026-10-07 | |
| D-045 | Done 열은 **펼친 상태로 시작**하고, 접힘 상태는 브라우저(localStorage)에 기억한다 | 2026-10-07 | |
| D-046 | 살구색은 대비 기준(4.5) 때문에 `#F2C1AE`로 조정한다. Overdue는 카드 색과 상관없이 **어두운 배지**(`#222` 배경, `#FF9B8F` 글자)로 표시한다 → 색은 **D-057로 개정** (Overdue 배지 방식은 유지) | 2026-10-07 | [SCREEN-SPEC 1.1](SCREEN-SPEC.md) |
| D-047 | Card 상세와 Projects 관리는 데스크톱에서 **오른쪽 400px 패널**, 모바일에서 **전체 화면 시트**로 연다 | 2026-10-07 | [SCREEN-SPEC](SCREEN-SPEC.md) |
| D-048 | 화면 확인용 **HTML 시안**을 `docs/mockups/`에 둔다. 구현 코드는 아니다 | 2026-10-07 | [mockups/board.html](mockups/board.html) |
| D-049 | 카드 순서는 status별 **정수 순번(0부터 빈틈없이)**으로 저장하고, 변경할 때마다 트랜잭션 안에서 다시 매긴다 | 2026-10-07 | [DATA-MODEL 4](DATA-MODEL.md) |
| D-050 | ID는 **UUID**(문자열)다. frontend가 낙관적 생성을 위해 만들 수 있다 | 2026-10-07 | [DATA-MODEL](DATA-MODEL.md) |
| D-051 | Due date는 **시간대 없는 `YYYY-MM-DD`**, `created_at`/`updated_at`은 **UTC ISO 8601**로 저장한다 | 2026-10-07 | [DATA-MODEL](DATA-MODEL.md) |
| D-052 | Inbox는 `projects.is_inbox = 1`로 구분하고, DB 제약으로 정확히 1개를 보장한다 | 2026-10-07 | [DATA-MODEL](DATA-MODEL.md) |
| D-053 | Project 이름 중복은 **앞뒤 공백을 제거하고 영문 대소문자를 무시**해서 판단한다 | 2026-10-07 | [DATA-MODEL](DATA-MODEL.md) |
| D-054 | 색은 **색 이름**(`lavender` 등)으로 저장한다. 색 코드는 디자인 토큰에만 둔다 → 색 이름 목록은 D-057 | 2026-10-07 | [DATA-MODEL](DATA-MODEL.md) |
| D-055 | `cards.project_id`는 **FK ON DELETE RESTRICT**로 보호한다 | 2026-10-07 | [DATA-MODEL](DATA-MODEL.md) |
| D-056 | 디자인 언어는 사용자의 사이트 **채운(chaeun)**의 타이포그래피·색·태그 형식을 차용한다 | 2026-10-07 | [SCREEN-SPEC](SCREEN-SPEC.md) |
| D-057 | 색: 캔버스 `#252722`, 글자 `#f3f0e8`. Project 4색은 **mist / gold / sage / salmon**, Inbox는 **크림(`inbox`)** (D-042, D-046, D-054 개정) | 2026-10-07 | [SCREEN-SPEC 1.1](SCREEN-SPEC.md) |
| D-058 | 디스플레이 폰트는 **Bricolage Grotesque**(D-043 개정), 본문·한글은 Pretendard | 2026-10-07 | [SCREEN-SPEC 1.2](SCREEN-SPEC.md) |
| D-059 | 워드마크는 소문자 **`to-do zone✳`**로 표기한다. 앱 이름(D-001)은 그대로다 | 2026-10-07 | |
| D-060 | Card는 내용으로 자동 결정되는 **크기 단계**(Focus / L / M / S / Done)를 가진다. 열 폭은 **Todo 1 : Doing 1.35 : Done 0.85** | 2026-10-07 | [SCREEN-SPEC S1](SCREEN-SPEC.md) |
| D-061 | 그림자·**기울기·점선을 쓰지 않는다**. 드래그 중 Card는 회전 없이 살짝 커지고, 놓일 자리는 실선 면으로 표시한다 | 2026-10-07 | [SCREEN-SPEC 1.3](SCREEN-SPEC.md) |
| D-062 | Project마다 **아이콘 1개**(Lucide 24개 중 선택, 기본 `folder`, Inbox는 `inbox` 고정). DB에 `projects.icon`을 추가한다 | 2026-10-07 | [SCREEN-SPEC 1.4](SCREEN-SPEC.md), [DATA-MODEL](DATA-MODEL.md) |
| D-063 | 상태 아이콘 4종(오늘 `sun`, 지난 마감 `alert-circle`, 날짜 `calendar`, 완료 `check`)은 앱이 자동으로 붙인다 | 2026-10-07 | [SCREEN-SPEC 1.4](SCREEN-SPEC.md) |
| D-064 | Board 위에 **Hero**(날짜 eyebrow, 시간대별 영어 인사말, 한글 요약 문장)를 둔다. 요약은 필터와 무관하게 Board 전체 기준이다 | 2026-10-07 | [SCREEN-SPEC S1](SCREEN-SPEC.md) |
| D-065 | Project 이름은 앞뒤 공백을 제거하고 **1~30자**다 | 2026-10-07 | [DATA-MODEL](DATA-MODEL.md) |
| D-066 | 11-1(개발 환경)을 09·10보다 먼저 한다. 09·10은 11-3 전에 끝낸다 | 2026-10-07 | [PLAN](PLAN.md) |
| D-067 | 혼자 하는 프로젝트이므로 `main`에 직접 커밋하고, 마일스톤마다 푸시한다 | 2026-10-07 | |
| D-068 | Card 순서 규칙(`columnCards`, `addCard`, `moveCard`, `removeCard`)은 **shared/ordering.ts** 하나를 frontend와 backend가 함께 쓴다 | 2026-10-07 | [ARCHITECTURE](ARCHITECTURE.md) |
| D-069 | backend 쓰기는 **프로세스 안 잠금 + batch**로 처리하고 libsql `transaction()`은 쓰지 않는다 | 2026-10-07 | [ADR-0006](adr/0006-write-lock-and-batch.md) |
| D-070 | **Done만 분기로 나눈다.** Todo·Doing은 분기와 상관없이 이어진다 (D-019 개정) | 2026-10-07 | [ADR-0007](adr/0007-quarterly-archive-by-completed-date.md) |
| D-071 | 분기는 **달력 분기**(Q1 1–3월 … Q4 10–12월)이고, 사용자 컴퓨터의 로컬 날짜로 판단한다 | 2026-10-07 | |
| D-072 | Card가 Done에 들어가면 **완료 시각(`completedAt`)**을 기록하고, Done에서 나가면 지운다. 완료 시각이 지난 분기면 Board에서 빠지고 **아카이브**에서만 보인다. 아카이브 여부는 저장하지 않고 계산한다 | 2026-10-07 | [ADR-0007](adr/0007-quarterly-archive-by-completed-date.md) |
| D-073 | 아카이브된 Card는 **보기 + "다시 열기"(Todo 맨 위로)**만 된다. 아카이브에서 삭제는 없다 | 2026-10-07 | |
| D-074 | 회고 대시보드(**11-7 Quarterly Review**): 분기 선택, 완료 수, Project별 막대, 완료 목록. 주별 흐름·이전 분기 비교는 다음 후보 | 2026-10-07 | [PRD F11](PRD.md) |
| D-075 | Board의 Done 열·열 개수·Project Progress는 **보이는 Card 기준**(Todo + Doing + 이번 분기 Done)이다 | 2026-10-07 | |
| D-076 | 사용자의 실제(개인) 데이터는 **저장소에 커밋하지 않는다**(public 저장소). 로컬 DB에만 둔다 | 2026-10-07 | |
| D-077 | 커밋 작성자 이름은 **Yusin Kim**이다 (이전 커밋은 그대로 둔다) | 2026-10-07 | |
| D-078 | Project 아이콘에 직접 그린 **`gimbap`(김밥 단면)**을 추가한다(총 25개). 고른햇살 Project에 쓴다 | 2026-10-07 | [SCREEN-SPEC 1.4](SCREEN-SPEC.md) |
| D-079 | 애니메이션은 **`motion`** 라이브러리로 한다. 모션 언어는 **"물방울"**: 탄성 스프링, 누를 때 눌림, 맺히듯 나타남, 선택 표시가 흘러가듯 이동. 출렁임은 오류처럼 보이지 않을 만큼만 | 2026-10-07 | [SCREEN-SPEC 1.5](SCREEN-SPEC.md) |
| D-080 | 상세 패널의 선택 칸은 브라우저 기본 부품 대신 직접 만든다: Status는 3칸 토글, Project는 아이콘이 보이는 목록, Due date는 빠른 선택 + 한글 미니 달력("10월 14일 (수)") | 2026-10-07 | [SCREEN-SPEC S2](SCREEN-SPEC.md) |
| D-081 | Quarterly Review는 헤더의 **Board / Review 전환**으로 들어가고, 주소는 **`#review`**다 (라우터 패키지 없음) | 2026-10-07 | [SCREEN-SPEC S5](SCREEN-SPEC.md) |
| D-082 | 운영체제의 **"동작 줄이기"** 설정을 켠 사용자에게는 애니메이션을 끈다 | 2026-10-07 | |
