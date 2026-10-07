# DECISIONS

확정된 결정만 적는다. 결정은 사람이 하고, 각 줄에 결정한 날짜를 남긴다.
되돌리기 어렵고 이유가 중요한 결정은 `docs/adr/`에 따로 기록하고 여기서 링크한다.

| ID | 결정 | 날짜 | 근거 |
|---|---|---|---|
| D-001 | 앱 이름은 **TO-DO ZONE**이다. 앱 안의 용어는 "Card"를 쓰고, "To-do"는 브랜드 이름에만 쓴다 | 2026-10-07 | [GLOSSARY](../GLOSSARY.md) |
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
| D-016 | Project 규칙: 이름 중복 **금지**, 색 중복 **허용**(파스텔 5색). Project를 삭제하면 그 카드는 **Inbox로 이동**한다. Inbox는 삭제와 이름 변경이 불가능하다 | 2026-10-07 | [GLOSSARY](../GLOSSARY.md) |
| D-017 | Due date는 **날짜만** 가진다. Overdue 카드는 Due date를 경고색으로 표시하고, Done 카드는 경고하지 않는다. 표기는 "오늘/내일/어제", 그 외 "10월 9일 (목)" | 2026-10-07 | [GLOSSARY](../GLOSSARY.md) |
| D-018 | 카드는 **모든 Status 열** 맨 위의 "+ New card"에서 **제목만** 입력해 만든다. 필터가 켜져 있으면 그 Project에, 아니면 **Inbox**에 넣는다. 메모와 Due date는 상세 패널에서 입력한다 | 2026-10-07 | |
| D-019 | Done 카드는 **전부 표시**하고, Done 열은 **접을 수 있다**. Archive는 MVP 이후 후보로 둔다 | 2026-10-07 | |
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
