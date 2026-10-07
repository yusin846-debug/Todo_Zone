# 개인용 Vercel 배포

루트 저장소에 `vercel.json`과 `api/index.ts`가 있다. Vercel 프로젝트 Root Directory는 저장소 루트, 빌드는 `npm run build -w frontend`, 출력은 `frontend/dist`다. API는 같은 도메인의 `/api/*`에서 실행된다. Git 자동 배포는 해당 프로젝트가 `main`에 연결되어 있어야 한다.

## 서버 환경 변수

Vercel Production에 아래 값을 등록한다. Preview는 별도 DB·인증 키를 사용하거나 미설정 상태로 둔다(미설정 시 API 503).

| 변수 | 값 |
|---|---|
| DATABASE_URL | Turso `libsql://...` 주소 |
| DATABASE_AUTH_TOKEN | 해당 DB 토큰 |
| AUTH_PASSWORD_HASH | scrypt 해시 |
| AUTH_SESSION_SECRET | 32자 이상의 랜덤 키 |

비밀 값에 `VITE_` 접두사를 붙이지 않는다. 저장소에 커밋하지 않는다. Vercel에서는 인증이 항상 필수다. 로컬에서 인증을 확인하려면 `AUTH_ENABLED=true`를 추가한다.

## 비밀번호 설정

PowerShell에서 아래 명령은 입력을 화면과 명령 기록에 표시하지 않는다. 해시·세션 키는 git 제외 파일 `backend/.env.auth`로 기록하며 기존 파일이 있으면 덮어쓰지 않는다.

```powershell
$credential = Get-Credential -UserName Yushin -Message '앱 로그인 비밀번호를 입력하세요 (12자 이상)'
$env:SETUP_PASSWORD = $credential.GetNetworkCredential().Password
npm.cmd run auth:setup -w backend
Remove-Item Env:SETUP_PASSWORD
```

생성된 파일의 두 값을 Vercel 환경 변수로 등록한다. 비밀번호 변경 시 새 해시와 키를 만들고 배포하면 기존 쿠키가 무효화된다. 채팅에 비밀 값을 보내지 않는다.

## DB 준비와 배포

1. Turso DB를 준비하고 DB 주소·토큰을 환경 변수에 설정한다.
2. **배포 전에** 같은 DB를 대상으로 루트에서 `npm.cmd run db:migrate -w backend`를 실행한다. 기존 Card는 빈 체크리스트로 유지된다. 마이그레이션은 재실행 가능하다.
3. Vercel 환경 변수·Root Directory를 설정한 뒤 Git 푸시 또는 Redeploy한다.
4. 로그아웃 상태에서 개인 데이터 API가 401인지, 로그인 후 Card 저장·새로고침 유지·로그아웃이 동작하는지 확인한다.

서버리스 요청마다 마이그레이션을 실행하지 않는다. 환경 변수 누락은 API 503으로 처리한다. 로컬 DB 파일과 개인 데이터는 자동 업로드하지 않는다. 이 앱은 소유자 1명용이며 회원가입·다중 사용자 데이터 분리는 제공하지 않는다.

## 세션

7일 만료, HttpOnly·Secure·SameSite=Strict 쿠키, DB 세션 폐기, 동일 출처 쓰기 검사. 로그인 시도는 DB에 공유되어 15분에 10회로 제한된다. 원격 Card·Project·Area 변경은 write transaction으로 처리한다.
