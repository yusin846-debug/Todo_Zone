import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { hashPassword } from './auth.ts';

// 채팅이나 명령 인자 대신 환경 변수로 비밀번호를 받아 git 제외 파일에 기록한다.
const password = process.env.SETUP_PASSWORD;
if (!password || password.length < 12)
  throw new Error('SETUP_PASSWORD에 12자 이상 비밀번호를 설정해 주세요.');
writeFileSync(
  '.env.auth',
  `AUTH_ENABLED=true\nAUTH_PASSWORD_HASH=${await hashPassword(password)}\nAUTH_SESSION_SECRET=${randomBytes(32).toString('hex')}\n`,
  { flag: 'wx' },
);
console.log('Created backend/.env.auth (values are not printed).');
