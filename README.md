# deploy-lab — AI와 로컬 검증부터 배포까지

메모를 저장·조회하는 작은 서비스다. 12주차는 내 컴퓨터에서 실행·검증하고(미션 1~13), 13주차는 Neon·Render·Vercel로 배포한다(미션 14~19).
기본 저장·조회는 제공된다. 최대 20자·최소 2자는 학생이 스펙을 보고 구현한다. 지금 할 작업은 [_docs/README.md](_docs/README.md)에서 고른다.

## 구조

```
브라우저 ──API 요청──▶ Node 서버 ──SQL──▶ PostgreSQL ◀── Adminer
apps/web :5173        apps/server :3000    Docker :5432     Docker :8080
(내 컴퓨터)            (내 컴퓨터)           └─ docker-compose.yml ─┘
```

```
deploy-lab/
├── apps/web/            화면 (React + Vite)
│   └── src/             App.jsx 화면 · api.js 서버 호출 · rules.js 입력 규칙
├── apps/server/         API 서버 (Express + pg)
│   ├── index.js         API 경로 (/health, /db-check, /api/records)
│   ├── rules.js         입력 규칙 (화면 규칙과 같아야 한다)
│   └── migrations/      DB 구조 변경 SQL (번호 순서)
├── _docs/               작업 문서 — 작업 목차, tasks/별 PRD·스펙·검증
├── docker-compose.yml   DB·Adminer 컨테이너 구성
├── DOCKER.md            Docker 설명·문제 해결
└── AGENTS.md            AI 작업 지침 (CLAUDE.md도 이것을 읽는다)
```
실제 비밀값은 `.env` 파일에만 둔다. `.env.example` 외의 `.env`는 GitHub에 올리지 않는다.

## 0. 준비 (처음 한 번)
모든 명령은 deploy-lab 루트에서 실행한다.
1. GitHub에 올린 저장소를 GitHub Desktop에서 Clone → VS Code로 루트 열기.
2. Node 22.12 이상, Docker Desktop 실행, AI 확장 로그인.
3. `docker version`에 Client와 **Server**가 모두 나오고 `docker compose version`이 나오는지 확인한다. Server가 없으면 → [DOCKER.md 1장](DOCKER.md#1-엔진이-켜져-있는가--docker-version)
4. `npm install --prefix apps/server`, `npm install --prefix apps/web`

| 명령 | 하는 일 |
|---|---|
| `npm run web` | 화면 실행 (5173) |
| `npm run server` | 서버 실행 (3000) |
| `npm run migrate` | 아직 적용 안 된 마이그레이션을 DB에 적용 |
| `npm run new-migration -- 이름` | 새 마이그레이션 SQL 파일 만들기 |

## 1. DB·Adminer 켜기
1. 네 포트(5432·8080·3000·5173)가 비어 있는지 확인한다. 아무것도 안 나오면 비어 있다.
   - macOS: `lsof -nP -iTCP:5432 -sTCP:LISTEN` (번호만 바꿔 네 번)
   - Windows: `netstat -ano | findstr :5432`
   - 지난주 컨테이너: `docker ps`
   - 쓰는 프로그램이 있으면 **임의로 끄지 않는다.** 결과 읽는 법·포트 바꾸는 법 → [DOCKER.md 5장](DOCKER.md#5-막혔을-때)
2. 컨테이너를 올린다.
```bash
docker compose up -d --wait
docker compose ps        # db는 healthy, adminer는 running
```
처음에는 이미지를 내려받느라 시간이 걸린다. 막히면 `docker compose logs --tail 30 db`.

## 2. Adminer로 DB 보기
`http://localhost:8080`에 접속해 로그인한다.

| 시스템 | 서버 | 사용자 이름 | 비밀번호 | 데이터베이스 |
|---|---|---|---|---|
| PostgreSQL | `db` | `lab` | `lab-local-only` | `deploylab` |

- 로그인 직후 테이블이 없는 것은 정상이다. 3단계의 마이그레이션이 만든다.
- 서버 칸이 `localhost`가 아니라 `db`인 이유 → [DOCKER.md 4장](DOCKER.md#4-같은-네트워크--왜-adminer는-db-서버는-localhost인가)
- 이 비밀번호는 로컬 실습 전용이다. 외부 DB에는 쓰지 않는다.

## 3. 서버 켜기
1. `apps/server/.env.example`을 같은 폴더에 `.env`로 복사한다(이미 있으면 덮어쓰지 않는다).
2. `npm run migrate` → `적용: 001_records.sql`. 다시 치면 `이미 적용`이 나온다. Adminer를 새로고침해 `records` 표를 확인한다.
3. 새 터미널에서 `npm run server` → `[서버] 3000 / DB: ...`
4. 브라우저로 확인한다.
   - `http://localhost:3000/health` → `ok: true`
   - `http://localhost:3000/db-check` → `ok: true`, `schemaReady: true`
   - `http://localhost:3000/api/records` → 메모 목록

## 4. 화면 켜기
화면은 서버·DB 없이도 켜진다. 먼저 켜 두었다면 1은 건너뛰고 상태 줄의 `다시 확인`만 누른다.
1. 새 터미널에서 `npm run web` → `http://localhost:5173`
2. 상태 줄이 서버·DB 정상인지 보고, 메모를 저장한 뒤 Adminer `records`에 같은 행이 생겼는지 본다.
- 서버가 꺼져 있으면 상태 줄에 `응답 없음`이 나온다. 화면과 서버가 별개 프로그램이라는 증거다.
- 화면을 켜 둔 채 파일을 고치면 브라우저가 바로 갱신된다. 되돌려도 바로 돌아온다.
- `Port 5173 is in use`로 멈추면 1단계처럼 포트를 확인한다. 서버가 `http://localhost:5173`만 허용하므로 다른 번호로 바뀌지 않게 막아 두었다.

## 5. DB 구조를 바꿀 때
1. `npm run new-migration -- add_title` → `migrations/002_add_title.sql` 생성
2. 첫 줄 `-- [작성 전]`을 지우고 SQL을 쓴다. 예: `ALTER TABLE records ADD COLUMN title TEXT;`
3. `npm run migrate` → `적용: 002_add_title.sql`
- 한 번 적용한 파일은 고치지 않는다. 바꾸려면 새 파일을 하나 더 만든다.
- 기본 미션(최대 20자·최소 2자)은 DB 구조를 바꾸지 않으므로 필요 없다.
