// backend/.env가 있으면 읽는다. 없으면 기본값을 쓴다 (예시: backend/.env.example).
try {
  process.loadEnvFile();
} catch {
  // .env 없음: 기본값 사용
}

export const config = {
  // ADR-0002: 로그인이 없으므로 내 컴퓨터에서만 접속을 받는다.
  host: process.env.HOST ?? '127.0.0.1',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? 'file:./data/todo-zone.db',
};
