import { defineConfig } from 'drizzle-kit';

// 마이그레이션 파일 생성: npm run db:generate -w backend
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
