# TypeScript 하나로 React + Express + SQLite를 쓴다

프론트엔드는 React + Vite, 백엔드는 Node.js + Express로 만들고, 둘 다 TypeScript로 작성한다. 언어를 하나로 통일하면 익혀야 할 언어가 하나뿐이다. DB는 별도 설치가 필요 없는 파일 기반 **SQLite**를 쓴다. 로컬 전용, 사용자 1명이라는 전제([ADR-0002](0002-server-without-login-local-only.md))에서는 DB 서버를 따로 운영할 이유가 없다.

## Considered Options

- Next.js: 서버 기능이 포함되어 있어서, frontend와 backend를 나눠 만드는 구현 순서(step11-2 → 11-3 → 11-4)와 경계가 겹친다.
- Python + FastAPI: 프론트와 언어가 달라진다.
- PostgreSQL: DB 서버를 설치하고 실행해야 한다. 여러 사용자나 외부 배포가 필요해지면 다시 검토한다.
