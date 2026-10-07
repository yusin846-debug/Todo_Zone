# TO-DO ZONE

해야 할 일을 파스텔 카드로 만들어 보드 위에서 옮기며 관리하는 **개인용 웹앱**.

- 구조: Trello (카드 1장 = 할 일 1개)
- 시각 형식: Morrow (다크 캔버스 + 파스텔 카드)
- 언어: 타이틀은 영어, 내용은 한글

> 현재 상태: **개발 중** (step11-1 개발 환경 완료). 진행 상황은 [PLAN](docs/PLAN.md).

## 문서

| 문서 | 내용 |
|---|---|
| [AGENTS.md](AGENTS.md) | AI 에이전트 작업 규칙 |
| [GLOSSARY.md](GLOSSARY.md) | 용어집 |
| [docs/DECISIONS.md](docs/DECISIONS.md) | 확정된 결정 목록 |
| [docs/adr/](docs/adr/) | 주요 결정의 배경 기록 |
| [docs/PLAN.md](docs/PLAN.md) | 마일스톤과 진행 상태 |
| [docs/PRD.md](docs/PRD.md) | MVP 기능과 수용 기준 |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | 구성 요소와 데이터 흐름 |
| [docs/SCREEN-SPEC.md](docs/SCREEN-SPEC.md) | 화면 명세, 디자인 토큰, 문구표 |
| [docs/DATA-MODEL.md](docs/DATA-MODEL.md) | 테이블, 제약, 순서 규칙 |
| [docs/mockups/board.html](docs/mockups/board.html) | Board 화면 시안 (브라우저로 열기) |
| [docs/design-insights-morrow.md](docs/design-insights-morrow.md) | Morrow 디자인 분석 |
| [docs/design-insights-readymag.md](docs/design-insights-readymag.md) | Readymag 디자인 분석 |

## 실행 방법

필요: Node.js 24 이상

```bash
npm install
npm run dev        # frontend http://localhost:5173, backend http://127.0.0.1:3000
```

| 명령 | 내용 |
|---|---|
| `npm run dev` | frontend + backend 동시 실행 |
| `npm test` | 모든 워크스페이스 테스트 |
| `npm run typecheck` | 모든 워크스페이스 타입 검사 |

backend 설정을 바꾸려면 `backend/.env.example`을 `backend/.env`로 복사해서 고친다.

스킬(에이전트용)은 `npx skills experimental_install`로 설치한다 (D-030).
