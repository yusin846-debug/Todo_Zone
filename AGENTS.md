# AGENTS.md

## 목적
TO-DO ZONE: 할 일을 카드로 관리하는 개인용 웹앱을 만드는 저장소다.
**결정은 사람이 하고, AI는 제안한다.** 확정되지 않은 내용은 "제안" 또는 "미정"으로 표시해서 적는다.

## 환경
- 서버 + DB에 저장, 로그인 없음, 로컬 실행 전용 ([ADR-0002](docs/adr/0002-server-without-login-local-only.md))
- TypeScript / React + Vite (`frontend/`) / Node.js + Express (`backend/`) / `shared/` / SQLite (Drizzle + libSQL)
- 구조와 경계: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- 실행·테스트 명령: 루트 `package.json` scripts (`npm run dev`, `npm test`, `npm run typecheck`)

## 작업 전
1. 작업 요청마다, 파일을 바꾸거나 명령을 실행하기 전에 다음 문서를 읽는다. 없는 파일은 "없다"고 말한다.
   - [README.md](README.md), [docs/DECISIONS.md](docs/DECISIONS.md), [docs/PLAN.md](docs/PLAN.md), [docs/PRD.md](docs/PRD.md)
   - [GLOSSARY.md](GLOSSARY.md): 용어는 여기 정의된 말만 쓴다 (예: 할 일 → **Card**)
2. 읽은 내용을 바탕으로 **계획**을 먼저 설명한다: 바꿀 파일, 확인 방법.
3. 사람이 승인한 뒤에 파일을 바꾸거나 명령을 실행한다.
4. 요청이 DECISIONS와 다르면 멈추고, 어느 결정과 충돌하는지 알린 뒤 사람에게 묻는다.

## 변경 범위
- 승인받은 계획의 파일만 바꾼다. 범위를 넘어야 하면 다시 승인받는다.
- 한 파일을 바꾸면 함께 고쳐야 할 파일을 알려 준다.
- 리팩터링, 이름 변경, 의존성 추가는 계획에 적고 승인받은 경우에만 한다.

## 완료 확인
- 바꾼 파일과, 실행한 확인 방법의 결과를 보고한다.
- 검사 결과는 실제로 실행한 것만 "통과"로 보고한다. 실행하지 못한 검사는 "실행하지 않음"과 이유를, 실패한 검사는 출력을 그대로 적는다.

## 안전
- 삭제, 덮어쓰기, 되돌리기 어려운 명령, 패키지 설치, 외부 전송은 사람이 명시적으로 승인한 뒤에만 한다.
- 비밀 정보(비밀번호, API 키, 토큰)는 환경 변수 등 저장소 밖에 둔다.
- 확실하지 않으면 묻는다.
