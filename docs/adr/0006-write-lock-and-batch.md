# 쓰기는 프로세스 안 잠금 + batch로 처리하고, transaction()은 쓰지 않는다

libsql 로컬 클라이언트는 `transaction()`을 호출하면 이후 쿼리용 연결을 새로 만든다. 그러면 `PRAGMA foreign_keys = ON`(FK RESTRICT 안전장치, D-055)이 풀리고, 테스트용 `:memory:` DB는 통째로 사라진다. 그래서 services는 "읽기 → 순서 계산(shared/ordering.ts) → `batch()`로 원자적 쓰기"로 동작한다. 읽기와 쓰기 사이에 다른 요청이 끼면(빠른 연속 드래그) 순번이 꼬일 수 있다. 이를 막기 위해 모든 쓰기를 프로세스 안 잠금(`services/lock.ts`)으로 한 번에 하나씩 처리한다. 서버 프로세스가 하나뿐인 로컬 전용 앱([ADR-0002](0002-server-without-login-local-only.md))이라 이것으로 충분하다.

## Consequences

- 서버를 여러 프로세스로 띄우거나 배포(PLAN 12)할 때는 이 잠금이 통하지 않는다. 그때는 DB 트랜잭션 방식으로 다시 검토한다.
- 동시 요청 테스트: `backend/src/cards.api.test.ts` "동시 요청".
