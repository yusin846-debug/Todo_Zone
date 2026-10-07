# API-SPEC

REST + JSON, 경로는 `/api/*` (D-035). 용어는 [GLOSSARY.md](../GLOSSARY.md), 필드는 [DATA-MODEL.md](DATA-MODEL.md), 규칙 근거는 [DECISIONS.md](DECISIONS.md)를 따른다.
요청·응답의 형태와 입력 제한은 `shared/`의 zod 스키마가 단일 출처다 (D-037).

## 1. 공통

| 항목 | 규칙 |
|---|---|
| 형식 | 요청·응답 모두 `application/json`, 필드 이름은 camelCase |
| ID | UUID 문자열 (D-050) |
| 날짜 | `dueDate`는 `YYYY-MM-DD` 또는 `null`, `createdAt`·`updatedAt`은 UTC ISO 8601 (D-051) |
| 인증 | 없음. 서버는 127.0.0.1에서만 받는다 (ADR-0002) |
| 문자열 | 서버가 앞뒤 공백을 제거한 뒤 길이를 검사한다. 길이는 코드 포인트 기준 (DATA-MODEL 3) |

### 1.1 오류 응답

```json
{ "error": { "code": "NAME_TAKEN", "message": "이미 같은 이름의 Project가 있어요." } }
```

| HTTP | code | 언제 | message (SCREEN-SPEC 문구표) |
|---|---|---|---|
| 400 | `VALIDATION` | 형식·길이·값이 규칙에 맞지 않음 | 항목별 한글 안내 (예: V1 "제목을 입력해 주세요.") |
| 400 | `INBOX_LOCKED` | Inbox 이름·색·아이콘 변경, 삭제 | V4 |
| 404 | `NOT_FOUND` | 없는 Card·Project, 또는 없는 `afterId` | "찾을 수 없어요. 새로고침해 주세요." |
| 409 | `NAME_TAKEN` | Project 이름 중복 (D-053) | V2 |
| 409 | `PROJECT_LIMIT` | Project 20개 초과 (D-034) | V3 |
| 500 | `INTERNAL` | 그 밖의 서버 오류 | T1 "저장하지 못했어요. 잠시 후 다시 시도해 주세요." |

`message`는 화면에 그대로 보여 줄 수 있는 문장이다. frontend는 `code`로 분기하고 `message`를 표시한다.

## 2. 엔드포인트

| 메서드 | 경로 | 내용 | PRD |
|---|---|---|---|
| GET | `/api/health` | 서버 확인 | — |
| GET | `/api/board` | Project 전체 + Card 전체 | F1, F9 |
| POST | `/api/cards` | Card 만들기 | F2 |
| PATCH | `/api/cards/:id` | 제목·메모·Due date·Project 수정 | F3 |
| POST | `/api/cards/:id/move` | Status·순서 바꾸기 | F4, F5 |
| DELETE | `/api/cards/:id` | Card 영구 삭제 | F7 |
| POST | `/api/projects` | Project 만들기 | F8 |
| PATCH | `/api/projects/:id` | 이름·색·아이콘 수정 | F8 |
| DELETE | `/api/projects/:id` | Project 삭제, Card는 Inbox로 | F8 |

### GET `/api/board`

Board 하나를 한 번에 받는다 (D-014). 개인용이라 데이터가 작다.

```json
// 200
{
  "projects": [
    { "id": "…", "name": "Inbox", "color": "inbox", "icon": "inbox", "isInbox": true,
      "createdAt": "…", "updatedAt": "…" }
  ],
  "cards": [
    { "id": "…", "title": "API-SPEC 쓰기", "memo": "", "dueDate": "2026-10-08",
      "status": "todo", "position": 0, "projectId": "…", "completedAt": null,
      "createdAt": "…", "updatedAt": "…" }
  ]
}
```

- `projects`는 Inbox가 먼저, 나머지는 `createdAt` 순. `cards`는 `status`, `position` 순.
- 아카이브된 Done Card도 함께 온다. 이번 분기인지는 frontend가 사용자 컴퓨터 날짜로 판단한다 (D-071, D-072).

### POST `/api/cards`

```json
// 요청
{ "id": "3f9c…(선택)", "title": "API-SPEC 쓰기", "status": "todo", "projectId": "…(선택)" }
// 201: 만들어진 Card
```

| 필드 | 규칙 |
|---|---|
| `id` | 선택. 낙관적 생성을 위해 frontend가 UUID를 보낼 수 있다 (D-050). 이미 있는 id면 400 |
| `title` | 필수, 공백 제거 후 1~100자 (D-031) |
| `status` | 필수, `todo` / `doing` / `done` |
| `projectId` | 선택. 없으면 Inbox (D-018). 없는 Project면 404 |

- 새 Card는 그 status의 **맨 위**(`position = 0`)에 들어가고 나머지는 1씩 밀린다 (D-013).
- `memo`는 `""`, `dueDate`는 `null`로 시작한다. `status`가 `done`이면 `completedAt`이 지금 시각으로 기록된다.

### PATCH `/api/cards/:id`

```json
// 요청: 바꿀 필드만
{ "title": "API-SPEC 쓰기", "memo": "…", "dueDate": "2026-10-09", "projectId": "…" }
// 200: 바뀐 Card
```

| 필드 | 규칙 |
|---|---|
| `title` | 공백 제거 후 1~100자 |
| `memo` | 0~2,000자 (D-031) |
| `dueDate` | `YYYY-MM-DD`(실제 있는 날짜) 또는 `null`(지우기) |
| `projectId` | 있는 Project |

- `status`와 `position`은 여기서 바꾸지 않는다. 순서 규칙을 한 곳(`move`)에서만 지키기 위해서다.
- 빈 객체 `{}`는 400.

### POST `/api/cards/:id/move`

```json
// 요청
{ "status": "doing", "afterId": "…또는 null" }
// 200: 영향받은 status들의 Card 전체 (position 순)
{ "cards": [ … ] }
```

- Card를 `status` 열에서 `afterId` Card **바로 뒤**에 놓는다. `afterId`가 `null`이면 맨 위 (DATA-MODEL 4).
- 필터 중이어도 `afterId`는 화면에 보이는 Card의 id를 그대로 보내면 된다. 서버가 status 전체 순서에서 그 바로 뒤에 끼운다.
- `afterId`가 그 status에 없거나 옮기는 Card 자신이면 404 / 400.
- 상세 패널의 Status 변경(F4 모바일)은 `{ "status": "done", "afterId": null }`.
- Done에 들어가면 `completedAt`을 기록하고, Done에서 나가면 `null`로 지운다. Done 안에서 순서만 바꾸면 그대로 둔다 (D-072).
- 아카이브 Card의 "다시 열기"(D-073)는 `{ "status": "todo", "afterId": null }`.
- 응답에는 원래 status와 새 status의 Card가 모두 들어간다. frontend는 이것으로 낙관적 변경을 확정한다 (D-038).

### DELETE `/api/cards/:id`

- 204. 뒤의 Card들의 position이 1씩 당겨진다. 복구할 수 없다 (D-015).

### POST `/api/projects`

```json
// 요청
{ "name": "학교", "color": "mist(선택)", "icon": "graduation-cap(선택)" }
// 201: 만들어진 Project
```

| 필드 | 규칙 |
|---|---|
| `name` | 필수, 공백 제거 후 1~30자 (D-065). 공백 제거·영문 소문자 기준으로 중복이면 409 `NAME_TAKEN` (D-053) |
| `color` | 선택, `mist`/`gold`/`sage`/`salmon`. 없으면 4색 순환 (D-042) |
| `icon` | 선택, 허용 목록 25개 중 하나(D-078). 없으면 `folder` (D-062) |

- 이미 20개(Inbox 포함)면 409 `PROJECT_LIMIT`.

### PATCH `/api/projects/:id`

- 바꿀 필드만: `name`, `color`, `icon` (규칙은 위와 같음). Inbox면 400 `INBOX_LOCKED`.
- 자기 이름을 대소문자만 바꾸는 것(`work` → `Work`)은 허용한다.

### DELETE `/api/projects/:id`

```json
// 200
{ "movedCards": 5 }
```

- 하나의 트랜잭션에서 그 Project의 Card를 모두 Inbox로 옮긴 뒤 Project를 삭제한다. Card의 순서는 바뀌지 않는다 (DATA-MODEL 4).
- Inbox면 400 `INBOX_LOCKED`.
