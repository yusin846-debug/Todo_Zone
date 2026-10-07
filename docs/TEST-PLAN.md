# TEST-PLAN

PRD의 수용 기준마다 대응하는 테스트를 둔다. 테스트 도구는 **Vitest**다. backend는 **supertest + 메모리 SQLite**(테스트마다 새 DB), frontend는 **Testing Library + jsdom**을 쓴다.

## 1. 테스트 층

| 층 | 무엇을 | 어디 | 실행 |
|---|---|---|---|
| 순수 로직 | 순서 규칙, 크기 단계, 날짜 표기, 요약, 진행률 | `frontend/src/lib/*.test.ts` | `npm test` |
| API 통합 | 엔드포인트의 응답, 규칙, 오류 코드, DB 제약 | `backend/src/**/*.test.ts` | `npm test` |
| 화면 | 열·필터·새 Card·한글 조합·Done 접기·서버 꺼짐·분기 숨김 | `frontend/src/App.test.tsx` (가짜 서버 `src/test/fakeApi.ts`, shared 규칙 사용) | `npm test` |
| 실제 브라우저 | 마우스 드래그, 데스크톱·모바일 화면, 애니메이션 중간 프레임 | 수동 + CDP 스크립트(작업 기록) | 마일스톤마다 |

테스트에서는 `MotionGlobalConfig.skipAnimations`로 애니메이션을 건너뛴다(`src/test/setup.ts`). 움직임 자체는 실제 브라우저 프레임 캡처로 확인한다.

**완료 판정:** `npm test`와 `npm run typecheck`가 모두 통과하고, 실제 브라우저 확인을 했을 때만 마일스톤을 완료로 표시한다 (AGENTS.md "완료 확인").

## 2. PRD 수용 기준 → 테스트

| PRD | 수용 기준 | 테스트 | 층 |
|---|---|---|---|
| F1 | 3개 열, 열별 개수, 빈 상태 | `App.test` 열·개수 | 화면 |
| F1 | 크기 단계 Focus/L/M/S/Done | `board.test` cardTier | 로직 |
| F1 | 요약 문장 (진행 중·오늘·지난 마감) | `board.test` summarize | 로직 |
| F1 | Board 조회: Inbox 먼저, Card 순서 | `board.api.test` GET /api/board | API |
| F2 | 맨 위에 생성, 순번 재계산 | `board.test` addCard · `cards.api.test` POST | 로직·API |
| F2 | 빈 제목·공백 제목 거부 | `App.test` · `cards.api.test` 400 | 화면·API |
| F2 | 한글 조합 중 Enter 무시 | `App.test` isComposing | 화면 |
| F2 | 100자 초과 거부 (이모지 포함 코드 포인트) | `cards.api.test` 400 | API |
| F2 | 필터 Project 또는 Inbox로 생성 | `App.test` · `cards.api.test` projectId 생략 | 화면·API |
| F3 | 제목·메모·Due date·Project 수정, 메모 2,000자 | `cards.api.test` PATCH · `Panels.test` | API·화면 |
| F3 | 빈 제목이면 Save 비활성 + V1, 저장 안 하고 닫으면 D2 | `Panels.test` | 화면 |
| F3 | 존재하지 않는 날짜(2026-02-30) 거부, null로 지우기 | `cards.api.test` PATCH | API |
| F4 | 열 사이·열 안 이동, 순번 빈틈없음 | `board.test` moveCard · `cards.api.test` move | 로직·API |
| F4 | 필터 중 이동은 보이는 Card 바로 뒤 | `board.test` · `cards.api.test` move | 로직·API |
| F4 | 마우스 드래그 | CDP 드래그 스크립트 | 브라우저 |
| F5 | 완료 = Status Done, Done 접기 | `App.test` 접기 | 화면 |
| F6 | 오늘/내일/어제, "10월 9일 (금)", Done은 overdue 아님 | `dates.test` dueLabel | 로직 |
| F7 | 삭제 후 순번 당김, 없는 id는 404 | `cards.api.test` DELETE | API |
| F7 | 확인 창 D1, 기본 포커스 Cancel | `Panels.test` | 화면 |
| F8 | 생성(4색 순환, 기본 아이콘), 이름 1~30자 | `projects.api.test` POST | API |
| F8 | 이름 중복(공백·대소문자 무시) 409 | `projects.api.test` | API |
| F8 | 20개 제한 409 | `projects.api.test` | API |
| F8 | Inbox 수정·삭제 400 | `projects.api.test` | API |
| F8 | 삭제 시 Card는 Inbox로, 순서 유지 | `projects.api.test` DELETE | API |
| F8 | 만들기·중복 문구(V2)·Inbox 잠금·아이콘 변경·D3 카드 수 | `Panels.test` | 화면 |
| F9 | 필터 켜기·다시 눌러 해제, Progress | `App.test` · `board.test` progressOf | 화면·로직 |
| F10 | completedAt 기록·삭제, 이번 분기만 Board에 | `board.test` · `quarter.test` · `cards.api.test` · `App.test` | 로직·API·화면 |
| F10 | Done ⇔ completed_at (CHECK) | `constraints.test` | API |
| F10 | Reopen → Todo 맨 위 (지난 분기만) | `Review.test` | 화면 |
| F11 | 분기 목록·분기별 완료·Project 묶음·비율 | `review.test` | 로직 |
| F11 | #review 진입·유지, 완료 수, 빈 분기 문구 | `Review.test` | 화면 |
| D-080 | 날짜 빠른 선택·달력, Project 목록, Status 방향키 | `dates.test` · `Panels.test` | 로직·화면 |

## 3. 데이터 안전장치 테스트 (DATA-MODEL 5)

서비스에 버그가 있어도 DB가 막는지 직접 확인한다.

| 제약 | 테스트 |
|---|---|
| Inbox는 1개 (부분 UNIQUE) | 두 번째 Inbox INSERT가 실패한다 |
| `inbox` 색·아이콘은 Inbox 전용 (CHECK) | 일반 Project에 `color = 'inbox'` INSERT가 실패한다 |
| `cards.project_id` FK RESTRICT | Card가 남은 Project를 DB에서 바로 DELETE하면 실패한다 |
| title 길이, status 값 (CHECK) | 규칙 밖 값 INSERT가 실패한다 |

## 4. 이번 범위 밖

- 서버 꺼짐·저장 실패 화면(E4, T1): 11-6에서 추가한다.
