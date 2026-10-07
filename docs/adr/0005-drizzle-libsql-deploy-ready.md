# DB 접근은 Drizzle ORM + libSQL 클라이언트로 한다 (배포 대비)

MVP는 로컬 전용([ADR-0002](0002-server-without-login-local-only.md))이지만, 나중에 Vercel 같은 서버리스 환경에 배포할 가능성을 열어 둔다. 서버리스 환경에서는 로컬 SQLite 파일이 유지되지 않는다. 그래서 SQLite와 같은 SQL을 쓰면서 로컬 파일(`file:`)과 원격 DB(Turso, `libsql://`)를 모두 지원하는 **libSQL 클라이언트**를 쓰고, 그 위에 타입이 자동으로 나오고 마이그레이션 파일을 남기는 **Drizzle ORM**을 얹는다. 배포할 때는 `DATABASE_URL`만 바꾸면 된다.

## Considered Options

- `better-sqlite3`로 SQL 직접 작성: 가장 단순하지만 로컬 파일 전용이라, 배포할 때 DB 접근 코드를 다시 써야 한다.
- Prisma: 기능은 많지만 무겁고, 생성되는 SQL이 잘 보이지 않는다.

## Consequences

- 배포할 때는 이 결정이 아니라 ADR-0002(로그인 없음)를 먼저 다시 검토해야 한다. 공개된 주소에서는 인증이 필요하다.
