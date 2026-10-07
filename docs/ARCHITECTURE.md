# ARCHITECTURE

용어는 [GLOSSARY.md](../GLOSSARY.md), 결정 근거는 [DECISIONS.md](DECISIONS.md)의 ID를 따른다.
테이블 상세는 DATA-MODEL(step08), 엔드포인트 상세는 API-SPEC(step09)에서 정한다. 이 문서는 **구성 요소와 그 경계**만 정한다.

## 1. 구성도

```
┌──────────────────── 사용자 컴퓨터 (로컬 전용, D-006) ─────────────────────┐
│                                                                          │
│  Browser                                                                 │
│  ┌───────────────────────────┐                                           │
│  │ frontend  (React + Vite)  │  localhost:5173                           │
│  │  ├ UI 컴포넌트 (Board/Card…)│                                           │
│  │  ├ TanStack Query (서버 상태)│                                           │
│  │  └ api client (fetch)     │                                           │
│  └────────────┬──────────────┘                                           │
│               │  /api/*  (Vite 프록시)                                    │
│               ▼                                                          │
│  ┌───────────────────────────┐        ┌──────────────────────────┐       │
│  │ backend  (Express)        │        │ SQLite 파일               │       │
│  │  127.0.0.1:3000           │──────▶ │ backend/data/todo-zone.db │       │
│  │  ├ routes   (HTTP)        │ libSQL │ (DATABASE_URL=file:…)     │       │
│  │  ├ services (규칙)         │ client └──────────────────────────┘       │
│  │  └ db       (Drizzle)     │                                           │
│  └───────────────────────────┘                                           │
│                                                                          │
│  shared/  ── zod 스키마 + 타입 ── frontend, backend 양쪽에서 import          │
└──────────────────────────────────────────────────────────────────────────┘
```

## 2. 폴더 구조 (D-027 개정, D-037)

```
todo-project/
├── package.json        ← npm workspaces 루트. `npm run dev`로 전체 실행
├── shared/             ← zod 스키마, 타입, 공통 상수(100자, 20개 등)
├── frontend/           ← React + Vite + TypeScript
│   └── src/
│       ├── api/        ← fetch 래퍼, TanStack Query 훅
│       ├── components/ ← Board, StatusColumn, CardItem, CardPanel, ProjectStrip …
│       ├── styles/     ← tokens.css (디자인 토큰), CSS Modules
│       └── lib/        ← 날짜 표기 등 순수 함수
├── backend/
│   ├── src/
│   │   ├── routes/     ← HTTP 요청·응답만 담당
│   │   ├── services/   ← 도메인 규칙 (Inbox 보호, 이름 중복, 순서, 20개 제한)
│   │   └── db/         ← Drizzle 스키마, 연결, 마이그레이션
│   └── data/           ← SQLite 파일 (git 제외)
└── docs/
```

## 3. 구성 요소별 책임

| 구성 요소 | 책임 | 하지 않는 일 |
|---|---|---|
| **shared** | 입력 형태와 제한(제목 100자, 메모 2,000자, Status 3종, 파스텔 5색)을 **한 곳에서** 정의 | 화면, DB 접근 |
| **frontend / components** | 화면 그리기, 드래그, 입력. 한글 조합(`isComposing`) 처리 | 도메인 규칙 판단(서버가 최종 판단) |
| **frontend / api** | 서버 호출, 캐시, **낙관적 업데이트**와 실패 시 되돌리기 (D-038) | 화면 그리기 |
| **backend / routes** | URL·메서드 매핑, shared 스키마로 입력 검사, HTTP 상태 코드 | 도메인 규칙 |
| **backend / services** | Inbox 보호, Project 이름 중복 금지, 20개 제한, Project 삭제 시 Card를 Inbox로 이동, Card 순서 재계산 | HTTP, SQL 세부 |
| **backend / db** | 테이블 정의, 쿼리, 트랜잭션, 마이그레이션 | 규칙 판단 |

**규칙의 최종 판단은 서버(services)가 한다.** 프론트엔드도 같은 shared 스키마로 미리 검사하지만, 그건 빠른 안내를 위한 것이다.

## 4. 데이터 흐름

### 4.1 Board 열기 (F1, F9)
1. frontend가 Projects와 Cards를 요청한다.
2. backend가 DB에서 읽어 반환한다.
3. frontend가 Status별, 순서별로 그린다. Progress는 받은 Card로 계산한다.

### 4.2 Card 만들기 (F2)
1. 사용자가 제목을 입력하고 Enter를 누른다. 조합 중이면 무시한다.
2. frontend가 shared 스키마로 검사하고, 서버에 생성을 요청한다.
3. services가 Project를 결정한다(필터가 켜져 있으면 그 Project, 아니면 Inbox). Card를 그 Status의 맨 위에 넣는다.
4. 응답을 받으면 캐시를 갱신한다.

### 4.3 Card 옮기기 (F4) — 낙관적 업데이트
```
드래그 놓음 ─▶ 화면 즉시 변경 ─▶ 서버에 이동 요청 ─┬─ 성공: 서버 응답으로 캐시 확정
                                                └─ 실패: 원래 자리로 되돌림 + 한글 오류 안내
```
- 서버는 이동한 Card와 영향받는 Card들의 순서를 **하나의 트랜잭션**으로 저장한다.

### 4.4 Project 삭제 (F8)
1. services가 하나의 트랜잭션 안에서 처리한다: 그 Project의 Card를 모두 Inbox로 옮긴 뒤 Project를 삭제한다.
2. Inbox 삭제 요청은 거부한다.

## 5. PRD 기능 대응

| PRD | 처리하는 곳 |
|---|---|
| F1 Board 보기 | components(Board, StatusColumn) · api(조회) |
| F2 Card 만들기 | components(새 카드 입력) · shared(검사) · services(Project 결정, 맨 위 삽입) |
| F3 상세·수정 | components(CardPanel) · shared(검사) · services |
| F4 옮기기 | components(dnd-kit) · api(낙관적 업데이트) · services(순서, 트랜잭션) |
| F5 완료 | Status 값으로만 판단 (ADR-0003). 별도 처리 없음 |
| F6 Due date/Overdue | frontend lib(날짜 표기, Overdue 판단은 사용자 컴퓨터의 날짜 기준) |
| F7 삭제 | components(확인 창) · services |
| F8 Project 관리 | components · services(중복, 20개, Inbox 보호, 삭제 시 이동) |
| F9 필터·Progress | frontend(필터 상태, Progress 계산) |

## 6. 설정과 실행

| 항목 | 값 | 비고 |
|---|---|---|
| `DATABASE_URL` | `file:./data/todo-zone.db` | 배포 시 `libsql://…`로 교체 (ADR-0005) |
| `HOST` | `127.0.0.1` | 내 컴퓨터에서만 접속 가능 (ADR-0002를 코드로 보장) |
| `PORT` | `3000` | frontend는 5173, `/api`는 Vite 프록시 |
| 실행 | 루트에서 `npm run dev` | frontend, backend 동시 실행 |

설정 값은 `.env`에 두고, 예시는 `.env.example`로 저장소에 올린다.

## 7. 오류 처리 경계 (step11-6에서 구현)

| 상황 | 처리 |
|---|---|
| 입력 오류 (빈 제목, 100자 초과) | frontend가 먼저 안내하고, 서버도 400으로 거부 |
| 규칙 위반 (이름 중복, Inbox 삭제, 20개 초과) | 서버가 409/400 + 한글 메시지, frontend가 표시 |
| 서버 꺼짐, 네트워크 오류 | 낙관적 변경을 되돌리고 "서버에 연결할 수 없어요" 안내 |
| 없는 Card/Project | 404, frontend는 캐시를 새로고침 |

## 8. 배포 대비 (PLAN 12)

MVP 이후 Vercel 배포 시 바꿀 것: `DATABASE_URL`(Turso), Express를 서버리스 함수로 감싸기, **인증 추가(ADR-0002 재검토)**. 구조와 폴더는 그대로 둔다.
