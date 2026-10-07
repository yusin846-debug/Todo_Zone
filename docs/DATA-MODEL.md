# DATA-MODEL

용어는 [GLOSSARY.md](../GLOSSARY.md), 결정 근거는 [DECISIONS.md](DECISIONS.md)의 ID를 따른다.
DB는 SQLite이고 Drizzle + libSQL로 접근한다 ([ADR-0005](adr/0005-drizzle-libsql-deploy-ready.md)). 이 문서는 **테이블, 필드, 제약, 순서 규칙**을 정한다.

## 1. 관계

```
projects 1 ──────< cards
  (Inbox 1개 포함, 최대 20개)     (모든 Card는 정확히 1개의 Project에 속함)
```

## 2. 테이블

### 2.1 `projects`

| 열 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | TEXT | PK | UUID (D-050) |
| `name` | TEXT | NOT NULL, 앞뒤 공백 제거 후 1~30자 (D-065) | 화면에 보이는 이름 |
| `name_key` | TEXT | NOT NULL, **UNIQUE** | 중복 검사용. `trim(name)`을 영문 소문자로 바꾼 값 (D-053) |
| `color` | TEXT | NOT NULL, CHECK ∈ {`inbox`, `mist`, `gold`, `sage`, `salmon`} | 색 이름. 색 코드는 저장하지 않는다 (D-054, D-057) |
| `icon` | TEXT | NOT NULL, DEFAULT `'folder'` | Lucide 아이콘 이름. 허용 목록(24개 + `inbox`)은 shared에서 검사한다 (D-062) |
| `is_inbox` | INTEGER | NOT NULL, CHECK ∈ {0, 1}, DEFAULT 0 | Inbox 표시 (D-052) |
| `created_at` | TEXT | NOT NULL | UTC ISO 8601 (`2026-10-07T05:12:00.000Z`). Project 줄 정렬 기준 |
| `updated_at` | TEXT | NOT NULL | UTC ISO 8601 |

**테이블 제약**
- `UNIQUE INDEX ... ON projects(is_inbox) WHERE is_inbox = 1`: Inbox는 **최대 1개**.
- `CHECK ((is_inbox = 1 AND color = 'inbox') OR (is_inbox = 0 AND color <> 'inbox'))`: 흰색은 Inbox 전용 (D-042).
- `CHECK ((is_inbox = 1 AND icon = 'inbox') OR (is_inbox = 0 AND icon <> 'inbox'))`: `inbox` 아이콘은 Inbox 전용.
- Inbox는 첫 마이그레이션에서 1개 만든다(`name = 'Inbox'`, `color = 'inbox'`, `icon = 'inbox'`). 따라서 Inbox는 **정확히 1개**다.

> 아이콘 허용 목록에 DB CHECK를 걸지 않는 이유: 아이콘을 추가할 때마다 마이그레이션이 필요해진다. 색은 디자인 토큰과 1:1이라 CHECK를 건다.

### 2.2 `cards`

| 열 | 타입 | 제약 | 설명 |
|---|---|---|---|
| `id` | TEXT | PK | UUID. 낙관적 생성을 위해 frontend가 만들 수 있다 (D-050) |
| `title` | TEXT | NOT NULL, 1~100자 (D-031) | 앞뒤 공백을 제거하고 저장 |
| `memo` | TEXT | NOT NULL, DEFAULT `''`, 0~2,000자 (D-031) | 없으면 빈 문자열 |
| `due_date` | TEXT | NULL 허용, CHECK 형식 `YYYY-MM-DD` | **시간대 없는 날짜** (D-051) |
| `status` | TEXT | NOT NULL, CHECK ∈ {`todo`, `doing`, `done`} | 완료 = `done` (ADR-0003) |
| `position` | INTEGER | NOT NULL, ≥ 0 | 같은 status 안의 순서. 0이 맨 위 (D-049) |
| `project_id` | TEXT | NOT NULL, FK → `projects.id` **ON DELETE RESTRICT** | 안전장치 (D-055) |
| `created_at` | TEXT | NOT NULL | UTC ISO 8601 |
| `updated_at` | TEXT | NOT NULL | UTC ISO 8601 |

**인덱스:** `(status, position)`: Board 조회 순서.

> `(status, position)`에 UNIQUE를 걸지 않는다. SQLite는 행 단위로 제약을 검사하므로, 순번을 다시 매기는 도중에 일시적인 중복이 생겨 실패한다. "빈틈없는 순번"은 services가 트랜잭션 안에서 보장하고 테스트로 검증한다.

## 3. 글자 수 세는 법

"100자", "2,000자"는 **사람이 보는 글자 단위(유니코드 코드 포인트)**로 센다.
- JavaScript의 `str.length`는 이모지 하나를 2로 셀 수 있다. 그래서 shared 스키마에서는 `[...str].length`로 센다.
- SQLite의 `length()`는 코드 포인트로 센다. 그래서 DB CHECK와 결과가 같다.
- 한글 한 글자는 어느 방식이든 1자다.

## 4. 순서 규칙 (D-049)

같은 status 안의 Card는 `position`이 **0부터 빈틈없이** 이어진다(0, 1, 2, …). 모든 변경은 **하나의 트랜잭션**에서 처리한다.

| 동작 | 처리 |
|---|---|
| **만들기** | 그 status의 모든 Card `position + 1` → 새 Card를 `position = 0`으로 넣음 |
| **같은 열 안에서 이동** | 빼낸 뒤 남은 Card를 다시 매기고, 목표 위치에 끼운 뒤 다시 매김 |
| **다른 열로 이동** | 원래 열: 빠진 자리 뒤의 Card를 `-1`. 새 열: 목표 위치 이후의 Card를 `+1` 하고 끼움 |
| **상세 패널에서 Status 변경** | 다른 열로 이동 + 목표 위치 = 0 (맨 위, F4) |
| **삭제** | 빠진 자리 뒤의 Card를 `-1` |
| **Project 삭제** | Card의 `project_id`만 Inbox로 바뀐다. 순서는 바뀌지 않는다 |

**필터가 켜진 상태에서 옮길 때 (D-033):** 화면에는 그 Project의 Card만 보이지만 `position`은 status 전체 기준이다. 따라서 frontend는 "어떤 Card **바로 뒤**에 놓았는지"(보이는 Card의 id)를 보내고, 서버가 그 Card의 전체 순서 바로 뒤로 끼운다. 맨 위에 놓으면 status 전체의 맨 위로 간다.

## 5. 규칙과 지키는 곳

| 규칙 | 근거 | DB 제약 | services | shared(zod) |
|---|---|---|---|---|
| 제목 1~100자, 메모 0~2,000자 | D-031 | CHECK | ✓ | ✓ |
| Status 3종 | D-010 | CHECK | ✓ | ✓ |
| Due date는 날짜만 | D-017 | CHECK(형식) | ✓ | ✓ |
| 모든 Card는 Project 1개 | D-005 | NOT NULL + FK | | |
| 순서 0부터 빈틈없이 | D-049 | | ✓ (트랜잭션) | |
| Project 이름 중복 금지 | D-016 | UNIQUE(name_key) | ✓ (V2 문구) | |
| Project 최대 20개 | D-034 | | ✓ (V3 문구) | |
| Inbox 정확히 1개 | D-052 | 부분 UNIQUE + 시드 | ✓ | |
| Inbox 이름·색 변경, 삭제 금지 | D-016 | CHECK(색) | ✓ (V4 문구) | |
| 크림색·`inbox` 아이콘은 Inbox 전용 | D-042, D-062 | CHECK | ✓ | ✓ |
| Project 이름 1~30자 | D-065 | | ✓ (V5 문구) | ✓ |
| Project 아이콘은 허용 목록 중 하나 | D-062 | | ✓ | ✓ |
| Project 삭제 시 Card → Inbox | D-016 | FK RESTRICT(안전장치) | ✓ (트랜잭션) | |
| 삭제는 영구 | D-015 | | ✓ | |

**원칙:** 사용자에게 보일 오류 문구(V2~V4)는 services가 먼저 검사해서 만든다. DB 제약은 services에 버그가 있을 때 데이터가 깨지지 않게 막는 **마지막 안전장치**다.

## 6. 초기 데이터

| 표 | 내용 |
|---|---|
| projects | Inbox 1개 (`is_inbox = 1`, `color = 'inbox'`, `icon = 'inbox'`) |
| cards | 없음 |

## 7. 미정

없음.
