# Docker 설명서 — 왜 그렇게 하는가

실행 순서는 [README.md](README.md)를 따른다. 이 문서는 README의 Docker 단계가 **왜 그런지**와 **막혔을 때 볼 것**을 모았다.

## 1. 엔진이 켜져 있는가 — `docker version`

```bash
docker version
docker compose version
```

`docker` 명령은 두 부분으로 나뉜다.

| 부분 | 정체 | 언제 보이나 |
|---|---|---|
| Client | 내가 터미널에 치는 `docker` 프로그램 | 설치만 돼 있으면 항상 |
| Server | 요청을 받아 이미지를 받고 컨테이너를 실행하는 Docker 엔진 | Docker Desktop이 켜져 있을 때만 |

- Client만 나오고 아래에 `Cannot connect to the Docker daemon ... Is the docker daemon running?`(Windows는 `error during connect`)이 나오면 **설치는 됐지만 엔진이 꺼진 상태**다. Docker Desktop을 열고 고래 아이콘이 Running이 될 때까지 기다린 뒤 다시 친다.
- Server 부분까지 나와야 컨테이너를 실행할 수 있다. 설치 완료와 DB 실행은 다른 단계다.
- `docker compose version`은 아래 3장의 Compose 기능이 있는지 확인한다. `unknown command` 등이 나오면 Docker Desktop을 최신으로 업데이트한다. 예전 `docker-compose`(하이픈)가 아니라 `docker compose`(띄어쓰기)를 쓴다.

## 2. 이미지·컨테이너·볼륨

| 말 | 뜻 | 이 키트에서 |
|---|---|---|
| 이미지 | 프로그램을 실행할 수 있게 묶은 꾸러미(읽기 전용) | `postgres:17-alpine`, `adminer:5` |
| 컨테이너 | 이미지를 실제로 실행한 것 | `db`, `adminer` |
| 볼륨 | 컨테이너 밖에 따로 둔 저장 공간 | `dbdata` — DB 파일이 여기 저장된다 |

컨테이너를 지워도 볼륨은 남는다. 그래서 컨테이너를 다시 만들어도 저장한 메모가 그대로 있다. 데이터를 지우는 명령은 6장에 따로 적었다.

## 3. `docker`와 `docker compose`

| | `docker` | `docker compose` |
|---|---|---|
| 다루는 단위 | 컨테이너 하나씩 | 파일에 적힌 서비스 묶음 |
| 설정 | 명령마다 옵션을 직접 입력 | `docker-compose.yml`에 미리 적어 둠 |
| 예 | `docker ps` | `docker compose up -d --wait` |

`docker compose`는 별도 프로그램이 아니라 `docker`에 붙은 기능이다. 결국 같은 엔진에 요청한다.

Compose가 없다면 DB와 Adminer를 이렇게 따로 실행해야 한다.
```bash
docker network create lab-net
docker run -d --name db --network lab-net -e POSTGRES_PASSWORD=... -p 127.0.0.1:5432:5432 -v dbdata:/var/lib/postgresql/data postgres:17-alpine
docker run -d --name adminer --network lab-net -p 127.0.0.1:8080:8080 adminer:5
```
Compose를 쓰면 이 설정이 파일 하나에 남는다. 명령은 한 줄이고, 누가 실행해도 같은 구성이 나온다.

### `docker-compose.yml` 읽기

| 항목 | 뜻 |
|---|---|
| `services:` | 실행할 컨테이너 목록. 여기서는 `db`, `adminer` |
| `image:` | 어떤 이미지로 실행할지 |
| `environment:` | 컨테이너에 넘기는 설정값. DB 사용자·비밀번호·DB 이름 |
| `ports:` | `"127.0.0.1:내컴퓨터포트:컨테이너포트"`. 내 컴퓨터에서 컨테이너로 들어가는 문 |
| `volumes:` | 볼륨을 컨테이너 안 경로에 연결 |
| `healthcheck:` | DB가 **접속을 받을 준비가 됐는지** 주기적으로 검사. 통과하면 `healthy` |
| `depends_on:` | Adminer는 DB가 `healthy`가 된 뒤에 시작 |

`127.0.0.1`을 앞에 붙였으므로 같은 와이파이의 다른 사람은 내 DB에 들어올 수 없다.

## 4. 같은 네트워크 — 왜 Adminer는 `db`, 서버는 `localhost`인가

파일에 `networks:`가 없어도 `docker compose up`은 다음을 자동으로 한다.

1. 네트워크 하나를 만든다. 이름은 `폴더이름_default`(예: `deploy-lab_default`).
2. 파일의 서비스를 모두 그 네트워크에 연결한다.
3. 그 안에서는 **서비스 이름이 주소**가 된다. Adminer는 `db`라는 이름으로 DB를 찾는다.

```bash
docker network ls    # deploy-lab_default 가 보인다
```

| 누가 DB에 접속하나 | 어디서 도나 | 쓰는 주소 |
|---|---|---|
| Adminer | 컨테이너, 같은 네트워크 안 | `db:5432` |
| Node 서버 | 내 컴퓨터(호스트), 네트워크 밖 | `localhost:5432` (`ports:`로 열어 둔 문) |

- Adminer 안에서 `localhost`는 **Adminer 자신**이다. 그래서 서버 칸에 `localhost`를 쓰면 DB를 못 찾는다.
- 내 컴퓨터는 `db`라는 이름을 모른다. 이름은 Docker 네트워크 안에서만 통한다. 그래서 Node 서버는 `ports:`로 열어 둔 `localhost:5432`로 들어간다.
- 루트 `.env`에서 `DB_PORT=5433`으로 바꾸면 바뀌는 것은 **내 컴퓨터 쪽 번호**뿐이다. 서버의 `DATABASE_URL`은 `localhost:5433`으로 바꾸고, Adminer는 그대로 `db:5432`다.

생각해 볼 것: Node 서버도 컨테이너로 만들어 이 파일에 넣으면 `DATABASE_URL`의 주소는 무엇이 돼야 할까?

## 5. 막혔을 때

### 포트 확인 결과 읽기
컨테이너를 올리기 전에 네 포트(5432 DB · 8080 Adminer · 3000 서버 · 5173 화면)를 하나씩 확인한다.

**macOS**
```bash
lsof -nP -iTCP:5432 -sTCP:LISTEN
```
- `-iTCP:5432`는 그 포트만, `-sTCP:LISTEN`은 연결을 기다리는 프로그램만, `-nP`는 주소·포트를 숫자로 보여 준다.
- 누가 쓰고 있으면 이렇게 나온다. `COMMAND`가 프로그램, `PID`가 프로세스 번호다. 더 보려면 `ps -p 78951 -o pid,command`.
```
COMMAND   PID USER   FD   TYPE  ...  NAME
node    78951  bjh   16u  IPv4  ...  TCP 127.0.0.1:5173 (LISTEN)
```
- `sudo` 없이 치면 내 계정의 프로그램만 보인다. 빈 결과였는데 나중에 `port is already allocated`가 나면 `sudo lsof -nP -iTCP:5432 -sTCP:LISTEN`으로 다시 본다. 공식 설치 프로그램으로 깐 PostgreSQL은 이때만 보인다.
- 다른 방법: `nc -z 127.0.0.1 5432; echo $?` → `1`이면 비어 있음, `0`이면 사용 중.

**Windows (PowerShell)**
```powershell
netstat -ano | findstr :5432
```
- 상태가 `LISTENING`인 줄의 맨 끝 숫자가 PID다. 프로그램 이름은 `tasklist /FI "PID eq 4120"`.

**Docker 컨테이너**
```bash
docker ps        # PORTS 열에 127.0.0.1:5432->5432/tcp 처럼 나오는 컨테이너
docker ps -a     # 멈춘 것까지 모두
```
지난주 실습 컨테이너가 남아 있는 경우가 많다.

컨테이너를 올린 뒤 같은 명령을 다시 치면 5432·8080은 Docker 프로세스(macOS는 `com.docke` 등)로, 서버·화면을 켠 뒤에는 3000·5173이 `node`로 보인다.

### 포트가 이미 쓰일 때 (`port is already allocated` / `address already in use`)
- 나온 프로그램을 **임의로 끄지 않는다.** 내 것이고 지금 안 쓰는 것이 확실할 때만 끈다(컨테이너는 `docker stop 컨테이너이름`).
- 끌 수 없으면 포트를 바꾼다. 루트 `.env.example`을 `.env`로 복사하고 `DB_PORT=5433`, `ADMINER_PORT=8081`처럼 고친다.
- DB 포트를 바꿨으면 `apps/server/.env`의 `DATABASE_URL` 안 `localhost:5432`도 같은 번호로 맞춘다(4장 참고).

### 로그 보기
```bash
docker compose logs db           # DB 로그 전체
docker compose logs -f adminer   # 계속 따라 보기, 멈출 때 Ctrl+C
docker compose logs --tail 30 db # 마지막 30줄만
```
Docker Desktop에서는 Containers → 컨테이너 이름 클릭 → Logs 탭.

| 로그에 보이는 말 | 뜻 |
|---|---|
| `database system is ready to accept connections` | DB 정상 |
| `port is already allocated` | 위 포트 문제 |
| `Cannot connect to the Docker daemon` | 엔진이 꺼짐(1장) |
| `--wait`가 오래 끝나지 않음 | `docker compose logs db`로 DB가 어디서 멈췄는지 본다 |

실패 메시지를 AI에게 보낼 때는 로그 원문을 그대로 붙인다. 비밀번호가 섞여 있지 않은지 먼저 본다.

## 6. 멈추기·지우기 — 데이터가 남는가

| 명령 | 컨테이너 | 네트워크 | 볼륨(저장한 메모) |
|---|---|---|---|
| `docker compose stop` | 멈춤(남아 있음) | 남음 | 남음 |
| `docker compose down` | 지움 | 지움 | **남음** |
| `docker compose down -v` | 지움 | 지움 | **지움 — 메모·테이블 모두 사라짐** |

- 수업이 끝나면 `stop`이나 `down`이면 충분하다. 다음에 `docker compose up -d --wait`로 다시 켜면 메모가 그대로 있다.
- `down -v` 뒤에 다시 켜면 빈 DB다. `npm run migrate`부터 다시 해야 한다.
