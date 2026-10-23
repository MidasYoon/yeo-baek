# 데이터 모델 (DATA-MODEL)

> 저장할 정보의 이름과 뜻을 적는다. 무엇을 만들지는 `docs/PRD.md`, 구조는 `docs/ARCHITECTURE.md`를 따른다.
> 한 파일 안에 담당자별 절로 쓰고, 담당자별 절도 팀이 합의한 뒤에만 고친다 (D-007).
> 테이블별 절(2~9)은 모두 같은 목차 1~5를 따른다. 근거가 되는 PRD·SCREEN-SPEC 번호를 괄호로 적는다.
> API 주소와 요청·응답 모양은 적지 않는다 (`docs/API-SPEC.md` 몫).
> "제안"이나 "확인 필요"가 붙은 내용은 확정이 아니다.

## 1. 공통 (팀 합의)

### 테이블 목록

| 테이블 | 담는 것 | 담당 | 근거 |
| --- | --- | --- | --- |
| `trips` | 여행 한 건 | 서준 | D-001 |
| `places` | 여행에서 방문한 장소 한 곳 | 은희 | D-002 |
| `diaries` | 여행 중 쓴 일기 한 편 | 건용 | D-003 |
| `place_photos` | 장소에 붙인 사진 한 장 | 은희 | D-033 |
| `users` | 회원 한 명 | 팀 공동 | D-042 |
| `sessions` | 로그인 한 번 (로그인 유지용) | 팀 공동 | D-042 |
| `trip_likes` | 회원이 여행에 누른 좋아요 하나 | 팀 공동 | D-042 |
| `trip_comments` | 회원이 여행에 쓴 댓글 하나 | 팀 공동 | D-042 |

### 테이블 사이의 연결

```text
trips (1) ──< places  (여러 개)   places.trip_id  → trips.id
      (1) ──< diaries (여러 개)   diaries.trip_id → trips.id
places (1) ──< place_photos (0~4개)   place_photos.place_id → places.id

users (1) ──< trips          (여러 개)   trips.user_id         → users.id   (D-042)
      (1) ──< sessions       (여러 개)   sessions.user_id      → users.id
      (1) ──< trip_likes     (여러 개)   trip_likes.user_id    → users.id
      (1) ──< trip_comments  (여러 개)   trip_comments.user_id → users.id
trips (1) ──< trip_likes     (여러 개)   trip_likes.trip_id    → trips.id
      (1) ──< trip_comments  (여러 개)   trip_comments.trip_id → trips.id
```

- 장소와 일기는 꼭 한 여행에 속한다. `trip_id`는 비울 수 없다.
- `places`와 `diaries`는 서로 연결하지 않는다.
- 사진 한 장은 꼭 한 장소에 속한다. `place_id`는 비울 수 없다. 여행·일기 사진은 1장뿐이라 따로 테이블을 두지 않고 그 테이블의 `photo` 칸에 둔다. (D-033)
- 여행의 주인은 `trips.user_id`다. 장소·일기는 `user_id`를 두지 않고 그 여행의 주인을 따른다 (D-042).
- 좋아요·댓글은 여행에만 단다. 장소·일기에는 달지 않는다 (D-042).

### 공통 규칙

| 항목 | 규칙 | 근거 |
| --- | --- | --- |
| 필드 이름 | 영어 snake_case (`trip_id`, `start_date`). DB 필드에만 적용하고, 코드의 이름 규칙은 여전히 미정이다 | D-016 |
| `id` | 모든 테이블에 `id INTEGER PRIMARY KEY`를 둔다. SQLite가 정해 주는 번호를 쓰고, 나중에 추가한 것일수록 크다 | — |
| 날짜 | `TEXT`, `YYYY-MM-DD` | AGENTS 공통 규칙 |
| 만든·고친 시각 | 모든 테이블에 `created_at`, `updated_at`을 둔다. 형식은 `TEXT`, `YYYY-MM-DD HH:MM:SS`, 한국 시각이다. 기록용이며 순서에는 쓰지 않는다 | D-017 |
| 같은 날짜일 때의 순서 | 날짜(또는 날짜·시각)가 같으면 `id`로 가른다. 같은 초에 만든 줄은 `created_at`으로 가를 수 없기 때문이다 | PRD 공통 #2, L-11, H-05 |

### `created_at`, `updated_at` 넣는 방법

| 필드 | 처음 만들 때 | 고칠 때 |
| --- | --- | --- |
| `created_at` | DB 기본값 `DEFAULT (datetime('now', 'localtime'))`가 넣는다 | 바꾸지 않는다 |
| `updated_at` | `created_at`과 같은 DB 기본값이 넣는다 | 그 테이블의 라우터가 `datetime('now', 'localtime')`으로 넣는다 |

- `CURRENT_TIMESTAMP`는 UTC로 들어가므로 쓰지 않는다.
- SQLite에는 고칠 때 자동으로 바꾸는 기능이 없다. 트리거는 쓰지 않고 라우터가 넣는다.
- API 응답에 넣을지는 `docs/API-SPEC.md`에서 정한다.

### 사진 저장 (D-033)

| 항목 | 규칙 |
| --- | --- |
| 파일 위치 | 사진 파일은 DB에 넣지 않고 `backend/uploads/`에 둔다. Git에 올리지 않는다 |
| DB에 넣는 값 | 파일 이름만 넣는다 (`trips.photo`, `diaries.photo`, `place_photos.filename`). 서버가 붙인 겹치지 않는 이름(uuid + 확장자, 예: `3f2a…c1.jpg`)이고, 사용자가 올린 원래 파일 이름은 저장하지 않는다 |
| 형식·용량 | jpg·jpeg·png·webp, 한 장 5MB 이하 |
| 바꾸기·빼기 | 고칠 때 바꾸거나 뺀 사진 파일은 그 기능의 라우터가 `backend/uploads/`에서도 지운다 |
| 기록 지우기 | 여행·장소·일기를 지우면 그 기록의 사진 파일도 라우터가 지운다 |
| 기존 DB | 칸·테이블을 더하면서 `CREATE TABLE IF NOT EXISTS`가 이미 있는 테이블을 바꾸지 않으므로, 팀원 각자 `backend/yeoback.db`를 지우고 다시 만든다. 넣어 둔 데이터는 사라진다 |

### 장소·일기가 붙은 여행 지우기 막기 (R-T-012)

장소나 일기가 하나라도 붙은 여행은 지울 수 없다. 두 곳에서 함께 막는다. (D-015)

| 막는 곳 | 방법 | 하는 일 |
| --- | --- | --- |
| DB | `places.trip_id`, `diaries.trip_id`를 `REFERENCES trips(id) ON DELETE RESTRICT`로 둔다. `backend/database.py`(건용)가 DB에 연결할 때마다 `PRAGMA foreign_keys = ON`을 켠다 | 다른 길로 지우려 해도 DB가 거절한다 |
| `trips` 라우터 | 지우기 전에 그 여행의 장소 개수와 일기 개수를 센다. 하나라도 있으면 지우지 않는다 | 화면 안내 문구에 쓸 개수를 얻는다 (SCREEN-SPEC 3절 4번) |

- SQLite는 `PRAGMA foreign_keys = ON`을 켜지 않으면 외래 키를 검사하지 않는다. 연결마다 켜야 한다.
- 라우터가 돌려주는 응답 모양과 개수를 얻는 방법은 `docs/API-SPEC.md`에서 정한다.
- 좋아요·댓글은 여행 지우기를 막지 않는다. `trip_likes.trip_id`, `trip_comments.trip_id`는 `ON DELETE CASCADE`라 여행을 지우면 DB가 함께 지운다 (D-042, 8·9절).

### 회원 기능을 기존 DB에 더하기 (D-042)

| 항목 | 방법 |
| --- | --- |
| 새 테이블 4개 | `users`, `sessions`, `trip_likes`, `trip_comments`는 `CREATE TABLE IF NOT EXISTS`로 만든다. 이미 있는 DB에도 그대로 생긴다 |
| `trips.user_id` | `backend/database.py`가 시작할 때 칸이 없으면 `ALTER TABLE trips ADD COLUMN user_id INTEGER REFERENCES users(id)`로 더한다 (D-036과 같은 방식). 넣어 둔 여행은 그대로이고 `user_id`는 `NULL`이다 |
| 주인이 없는 여행 | 그 DB에 처음 가입한 회원(`id`가 가장 작은 회원)에게 붙인다. 회원가입을 저장할 때(같은 트랜잭션)와 백엔드를 켤 때(`init_db`), 회원이 한 명이라도 있으면 `user_id`가 `NULL`인 여행을 모두 그 회원의 것으로 바꾼다 (D-042). 켤 때도 하는 이유: 권한 검사(PLAN P-73) 전에 로그인 없이 만든 여행도 주인을 갖게 하기 위해서다 (AI 제안) |
| DB 다시 만들기 | 필요 없다. 넣어 둔 데이터는 그대로다 |

- 테이블을 만드는 순서: `users` → `trips` → … 순서로 둔다. `trips`·`sessions`·`trip_likes`·`trip_comments`가 `users(id)`를 가리키기 때문이다 (AI 제안).
- 가입한 회원이 아무도 없는 동안에는 기존 여행을 아무도 고치거나 지울 수 없다. 여행 만들기도 로그인해야 하므로, 가입한 뒤에 만든 여행에는 늘 주인이 있다.

### 열린 질문 (여러 테이블에 걸친 것)

지금은 없다.

## 2. `trips` (담당: 서준)

### 1. 필드

| 필드 | 뜻 | 타입 | 필수 | 입력 규칙 | 근거 |
| --- | --- | --- | --- | --- | --- |
| `id` | 여행 번호 | `INTEGER PRIMARY KEY` | 자동 | — | 1절 공통 규칙 |
| `name` | 여행명 | `TEXT NOT NULL` | 필수 | 20자 이하 | PRD 2절 3번 |
| `destination` | 여행지 | `TEXT NOT NULL` | 필수 | 20자 이하. 자유 입력이라 해외도 된다 | PRD 2절 3번 |
| `start_date` | 시작일 | `TEXT NOT NULL` | 필수 | `YYYY-MM-DD` | PRD 2절 3번 |
| `end_date` | 종료일 | `TEXT NOT NULL` | 필수 | `YYYY-MM-DD`. 시작일보다 빠를 수 없다. 같은 날은 된다 | PRD 2절 3번 |
| `info` | 여행 정보 (자유 메모) | `TEXT` | 선택 | 글자 수 제한 없음 | PRD 2절 3번 |
| `photo` | 대표사진 파일 이름 | `TEXT` | 선택 | 0~1장. 없으면 `NULL`. 1절 "사진 저장" | PRD 2절 3번, R-T-020, D-033 |
| `user_id` | 이 여행의 주인 (만든 회원) | `INTEGER REFERENCES users(id)` | 자동 | 만들 때 로그인한 회원의 `id`를 라우터가 넣는다. 본문으로 받지 않고 고칠 수 없다. D-042 전에 넣은 여행은 처음 가입한 회원이 생길 때까지 `NULL` (1절 "회원 기능을 기존 DB에 더하기") | PRD 7절, D-042 |
| `created_at` | 만든 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | `YYYY-MM-DD HH:MM:SS`. 기록용 | 1절 |
| `updated_at` | 마지막으로 고친 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | `YYYY-MM-DD HH:MM:SS`. 고칠 때 라우터가 넣는다 | 1절 |

- `user_id`는 `ALTER TABLE`로 더하는 칸이라 `NOT NULL`을 붙일 수 없다. 비지 않게 지키는 일은 라우터가 한다 (D-042, AI 제안).

### 2. 순서

- `start_date`가 늦은 것이 위, 같으면 `id`가 큰 것이 위다. (R-T-007, R-T-016)
- Home 최근 여행(A)은 이 순서의 첫 번째를 쓴다. (H-01)

### 3. 지키는 규칙

- 장소·일기가 붙은 여행은 지울 수 없다. (R-T-012, 1절)
- 기간을 고칠 때, 그 여행의 `places.visit_date`나 `diaries.date` 중 새 기간 밖의 것이 하나라도 있으면 고칠 수 없다. (R-T-017)
- 여행과 그 여행의 장소·일기를 만들고 고치고 지우는 일은 `user_id`의 회원만 한다 (D-042).
- 여행을 지우면 그 여행의 좋아요·댓글도 DB가 함께 지운다 (8·9절, D-042).

### 4. 다른 문서로 넘길 것

| 내용 | 문서 |
| --- | --- |
| 필수·20자·종료일 검사를 서버도 하는지, 그때의 오류 응답 모양 | `API-SPEC` |
| 지우기·기간 수정을 막을 때 돌려줄 장소·일기 개수와 응답 모양 (R-T-012, R-T-017) | `API-SPEC` |
| `created_at`, `updated_at`을 API 응답에 넣을지 | `API-SPEC` |

### 5. 열린 질문

지금은 없다.

## 3. `places` (담당: 은희)

### 1. 필드

| 필드 | 뜻 | 타입 | 필수 | 입력 규칙 | 근거 |
| --- | --- | --- | --- | --- | --- |
| `id` | 장소 번호 | `INTEGER PRIMARY KEY` | 자동 | — | 1절 공통 규칙 |
| `trip_id` | 이 장소가 속한 여행 | `INTEGER NOT NULL REFERENCES trips(id) ON DELETE RESTRICT` | 필수 | 있는 여행의 `id` | 1절 |
| `region` | 지역 (시·도) | `TEXT NOT NULL` | 필수 | 아래 시·도 17개 이름 중 하나를 그대로 저장한다. 화면이 고른 장소의 주소로 채운다 (D-036) | PRD 3절 3번, SCREEN-SPEC 4절 6번 |
| `name` | 장소 이름 | `TEXT NOT NULL` | 필수 | 글자 수 제한 없음 (D-036, 전에는 20자) | PRD 3절 3번 |
| `lat` | 위도 | `REAL` | 선택 | 33~39. `lng`·`kakao_place_id`와 함께 있거나 함께 없다. 기존 장소는 `NULL` | D-036 |
| `lng` | 경도 | `REAL` | 선택 | 124~132. `lat`·`kakao_place_id`와 함께 있거나 함께 없다 | D-036 |
| `kakao_place_id` | 카카오 장소 id | `TEXT` | 선택 | 카카오 장소 검색 결과의 `id` (숫자로만 된 글자). 같은 곳 핀을 묶는 데 쓴다 | D-036 |
| `visit_date` | 방문 날짜 | `TEXT NOT NULL` | 필수 | `YYYY-MM-DD`. 그 여행의 `start_date`~`end_date` 안 | PRD 3절 3번 |
| `memo` | 메모 | `TEXT` | 선택 | 20자 이하, 한 줄 | PRD 3절 3번 |
| `rating` | 별점 (청사초롱 수) | `INTEGER` | 새로 저장·고칠 때 필수 | 1~5 정수. DB는 비울 수 있고(기존 장소는 `NULL`), 필수는 서버가 지킨다 | PRD 3절 3번, D-043 |
| `created_at` | 만든 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | `YYYY-MM-DD HH:MM:SS`. 기록용 | 1절 |
| `updated_at` | 마지막으로 고친 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | `YYYY-MM-DD HH:MM:SS`. 고칠 때 라우터가 넣는다 | 1절 |

- `region`에 저장하는 값 (D-016): 서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종, 경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주
- 핀은 `lat`·`lng`에 찍고, 같은 `kakao_place_id`끼리 핀 하나로 묶는다. `lat`·`lng`가 없는 장소는 `region`의 시·도 가운데에 찍는다 (R-P-026, D-036. 시·도 가운데 좌표표는 개발 단계).
- `lat`·`lng`·`kakao_place_id`는 D-036에서 더한 칸이다. 이미 있는 DB에는 `backend/database.py`가 시작할 때 칸이 없으면 `ALTER TABLE places ADD COLUMN`으로 더한다. 넣어 둔 장소는 그대로이고 세 칸은 `NULL`이다 (D-036).
- `rating`은 D-043에서 더한 칸이다. 이미 있는 DB에는 `backend/database.py`가 시작할 때 칸이 없으면 `ALTER TABLE places ADD COLUMN rating INTEGER`로 더한다. 넣어 둔 장소는 그대로이고 `rating`은 `NULL`이다. 기존 장소 때문에 `NOT NULL`로 두지 않는다 (D-043).
- 사진(0~4장)은 이 테이블에 두지 않고 5절 `place_photos`에 둔다. (R-P-022, D-033)

### 2. 순서

- 한 여행의 장소: `visit_date`가 오래된 것이 앞, 같으면 `id`가 작은 것이 앞이다. (L-11) 장소 화면은 이를 뒤집어 최신순으로 보인다 (R-P-009, D-034).
- Home 최근 장소(B): 모든 여행에서 `visit_date`가 늦은 것, 같으면 `id`가 큰 것 1개. (H-02, H-05)

### 3. 지키는 규칙

- 장소가 있는 여행은 지울 수 없다. (R-T-012, 1절)

### 4. 다른 문서로 넘길 것

| 내용 | 문서 |
| --- | --- |
| `region`이 17개 이름 중 하나인지, 20자·기간 안 검사를 서버도 하는지와 오류 응답 모양 | `API-SPEC` |
| `lat`·`lng`·`kakao_place_id`의 서버 검사와 응답 모양 | `API-SPEC` |
| `rating`이 꼭 있고 1~5 정수인지 서버 검사 | `API-SPEC` |
| `created_at`, `updated_at`을 API 응답에 넣을지 | `API-SPEC` |

### 5. 열린 질문

지금은 없다.

## 4. `diaries` (담당: 건용)

### 1. 필드

| 필드 | 뜻 | 타입 | 필수 | 입력 규칙 | 근거 |
| --- | --- | --- | --- | --- | --- |
| `id` | 일기 번호 | `INTEGER PRIMARY KEY` | 자동 | — | 1절 공통 규칙 |
| `trip_id` | 이 일기가 속한 여행 | `INTEGER NOT NULL REFERENCES trips(id) ON DELETE RESTRICT` | 필수 | 있는 여행의 `id` | 1절 |
| `date` | 날짜 | `TEXT NOT NULL` | 필수 | `YYYY-MM-DD`. 그 여행의 `start_date`~`end_date` 안 | PRD 4절 3번 |
| `time` | 시각 | `TEXT NOT NULL` | 필수 | `HH:MM` 24시간 (예: `14:05`). 화면에서만 `오전/오후 H:MM`으로 바꿔 보여 준다 | PRD 4절 3번, SCREEN-SPEC 5절 6번 |
| `title` | 제목 | `TEXT NOT NULL` | 필수 | 50자 이하 | PRD 4절 3번 |
| `body` | 본문 | `TEXT` | 선택 | 글자 수 제한 없음. 비어 있어도 자동으로 채우지 않는다 | PRD 4절 3번 |
| `mood` | 기분 | `TEXT NOT NULL` | 필수 | 아래 기분 이름 5개 중 하나를 그대로 저장한다 | PRD 4절 3번 |
| `photo` | 사진 파일 이름 | `TEXT` | 선택 | 0~1장. 없으면 `NULL`. 1절 "사진 저장" | PRD 4절 3번, R-D-017, D-033 |
| `created_at` | 만든 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | `YYYY-MM-DD HH:MM:SS`. 기록용 | 1절 |
| `updated_at` | 마지막으로 고친 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | `YYYY-MM-DD HH:MM:SS`. 고칠 때 라우터가 넣는다 | 1절 |

- `time`을 `HH:MM`으로 저장하는 이유: 글자 순서대로 정렬해도 시간 순서가 맞는다. `오전/오후 H:MM` 글자로는 맞지 않는다. (D-016)
- `mood`에 저장하는 값 (D-016): 이름을 저장하고, 이모지는 화면이 이름에 맞춰 보여 준다.

| `mood` 값 | 화면 이모지 |
| --- | --- |
| 설렘 | 🤩 |
| 행복 | 😊 |
| 평온 | 😌 |
| 피곤 | 😩 |
| 아쉬움 | 🥲 |

### 2. 순서

- 한 여행의 일기: `date`·`time`이 오래된 것이 위, 같으면 `id`가 작은 것이 위다. 다이어리 화면은 이를 뒤집어 최신순으로 보인다 (R-D-008, D-034).
- Home 최근 일기(C): 모든 여행에서 `date`·`time`이 늦은 것, 같으면 `id`가 큰 것 1개. (R-D-013, H-02, H-05)

### 3. 지키는 규칙

- 일기가 있는 여행은 지울 수 없다. (R-T-012, 1절)

### 4. 다른 문서로 넘길 것

| 내용 | 문서 |
| --- | --- |
| `mood`가 5개 이름 중 하나인지, `time` 형식, 50자·기간 안 검사를 서버도 하는지와 오류 응답 모양 | `API-SPEC` |
| API가 `time`을 `HH:MM`으로 주고받는지, 화면이 `오전/오후 H:MM`으로 바꾸는 곳 | `API-SPEC` |
| `created_at`, `updated_at`을 API 응답에 넣을지 | `API-SPEC` |

### 5. 열린 질문

지금은 없다.

## 5. `place_photos` (담당: 은희)

### 1. 필드

| 필드 | 뜻 | 타입 | 필수 | 입력 규칙 | 근거 |
| --- | --- | --- | --- | --- | --- |
| `id` | 사진 번호 | `INTEGER PRIMARY KEY` | 자동 | — | 1절 공통 규칙 |
| `place_id` | 이 사진이 붙은 장소 | `INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE` | 필수 | 있는 장소의 `id`. 장소를 지우면 DB가 사진 줄도 지운다 (DM-01) | 1절, D-033 |
| `filename` | 사진 파일 이름 | `TEXT NOT NULL` | 필수 | 1절 "사진 저장" | R-P-022, D-033 |
| `created_at` | 만든 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | `YYYY-MM-DD HH:MM:SS`. 기록용 | 1절 |
| `updated_at` | 마지막으로 고친 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | `YYYY-MM-DD HH:MM:SS`. 사진 줄은 고치지 않고 빼고 더하므로 만든 시각과 같다 | 1절 |

### 2. 순서

- 한 장소의 사진: `id`가 작은 것(먼저 붙인 것)이 앞이다. 사용자가 순서를 바꿀 수 없다.

### 3. 지키는 규칙

- 한 장소에 사진은 4장까지다. (R-P-022)
- 장소를 지우면 그 장소의 사진 줄(DB가 `ON DELETE CASCADE`로)과 파일(`places` 라우터가)도 함께 사라진다. 사진이 있다고 장소를 못 지우게 막지는 않는다.

### 4. 다른 문서로 넘길 것

| 내용 | 문서 |
| --- | --- |
| 장소 요청·응답에서 사진 목록을 주고받는 모양, 4장 넘음·없는 파일 이름의 오류 응답 | `API-SPEC` |

### 5. 열린 질문

지금은 없다.

- 닫은 질문 (2026-10-22, PLAN P-36)
  - DM-01 장소를 지울 때 사진 줄을 지우는 방법: `place_id`를 `ON DELETE CASCADE`로 두어 DB가 함께 지운다. 사진 파일은 `places` 라우터가 지운다 (사람이 AI 제안대로 정함).

## 6. `users` (담당: 팀 공동)

> 근거: D-042, PRD 7절. 칸 이름·타입·글자 규칙은 AI 제안이다 (사람이 고른 항목: 아이디, 비밀번호(bcrypt), 닉네임, 프로필사진, `created_at`, `updated_at`).

### 1. 필드

| 필드 | 뜻 | 타입 | 필수 | 입력 규칙 | 근거 |
| --- | --- | --- | --- | --- | --- |
| `id` | 회원 번호 | `INTEGER PRIMARY KEY` | 자동 | — | 1절 공통 규칙 |
| `login_id` | 아이디 (로그인할 때 적는 것) | `TEXT NOT NULL UNIQUE` | 필수 | 4~20자, 영문 소문자·숫자·밑줄(`_`)만. 다른 회원과 겹칠 수 없다. 가입한 뒤 바꾸지 않는다. 기본 키 `id`와 헷갈리지 않게 `login_id`로 짓는다 | PRD 7절 3번 |
| `password_hash` | 비밀번호의 bcrypt 해시 | `TEXT NOT NULL` | 필수 | 비밀번호 원문은 어디에도 저장하지 않는다. bcrypt가 만든 글자(`$2b$…`, 소금 포함)를 그대로 넣는다 | PRD 7절 3번, D-042 |
| `nickname` | 닉네임 | `TEXT NOT NULL` | 필수 | 2~10자. 다른 회원과 겹쳐도 된다 | PRD 7절 3번 |
| `profile_photo` | 프로필사진 파일 이름 | `TEXT` | 선택 | 0~1장. 없으면 `NULL`. 1절 "사진 저장" | PRD 7절 3번, D-033, D-042 |
| `created_at` | 가입한 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | `YYYY-MM-DD HH:MM:SS`. 회원상세 창의 가입일로 쓴다 | 1절, PRD R-M-004 |
| `updated_at` | 마지막으로 고친 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | 닉네임·사진·비밀번호를 고칠 때 라우터가 넣는다 | 1절 |

### 2. 순서

- 회원 목록을 보이는 화면이 없어 순서를 정하지 않는다.

### 3. 지키는 규칙

- `login_id`는 겹칠 수 없다. DB의 `UNIQUE`와 라우터가 함께 막는다.
- `password_hash`는 API 응답·서버 로그·화면 어디에도 내보내지 않는다 (D-042).
- 회원을 지우는 기능(탈퇴)이 없으므로 `users` 줄은 지우지 않는다 (PRD 7절 6번).
- 사진을 바꾸거나 빼면 전 사진 파일도 라우터가 지운다 (1절 "사진 저장").

### 4. 다른 문서로 넘길 것

| 내용 | 문서 |
| --- | --- |
| 가입·로그인·정보수정 요청과 응답 모양, 글자 규칙 서버 검사, 겹친 아이디의 오류 | `API-SPEC` 7절 |

### 5. 열린 질문

- PRD M-01: 글자 수·글자 종류, 닉네임 겹침 허용은 AI 제안이다.

## 7. `sessions` (담당: 팀 공동)

> 근거: D-042. 로그인을 유지하려고 둔다. 칸과 유지 기간은 AI 제안이다.

### 1. 필드

| 필드 | 뜻 | 타입 | 필수 | 입력 규칙 | 근거 |
| --- | --- | --- | --- | --- | --- |
| `id` | 세션 번호 | `INTEGER PRIMARY KEY` | 자동 | — | 1절 공통 규칙 |
| `user_id` | 로그인한 회원 | `INTEGER NOT NULL REFERENCES users(id)` | 필수 | 있는 회원의 `id` | D-042 |
| `token` | 쿠키에 넣는 무작위 글자 | `TEXT NOT NULL UNIQUE` | 필수 | 서버가 Python `secrets.token_urlsafe(32)`로 만든다. 겹치지 않는다 | D-042, AI 제안 |
| `expires_at` | 로그인이 풀리는 시각 | `TEXT NOT NULL` | 필수 | `YYYY-MM-DD HH:MM:SS`, 한국 시각. 로그인한 때부터 7일 뒤 | PRD 7절 3번, AI 제안 |
| `created_at` | 로그인한 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | 기록용 | 1절 |
| `updated_at` | 마지막으로 고친 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | 세션 줄은 고치지 않으므로 만든 시각과 같다 | 1절 |

### 2. 순서

- 정하지 않는다 (목록으로 보이지 않는다).

### 3. 지키는 규칙

- 한 회원이 여러 세션을 가질 수 있다 (브라우저마다 로그인).
- 로그아웃하면 그 `token`의 줄을 지운다.
- `expires_at`이 지난 세션은 로그인하지 않은 것으로 보고, 발견한 라우터가 그 줄을 지운다 (AI 제안).
- 비밀번호를 바꾸면 그 회원의 다른 세션을 모두 지운다. 지금 브라우저의 세션은 남긴다 (AI 제안).
- `token`은 서버 로그에 남기지 않는다.

### 4. 다른 문서로 넘길 것

| 내용 | 문서 |
| --- | --- |
| 쿠키 이름·속성, 로그인 여부를 보는 방법 | `API-SPEC` 1절 "로그인" |

### 5. 열린 질문

- 로그인 유지 7일은 AI 제안이다 (PRD M-01).

## 8. `trip_likes` (담당: 팀 공동)

> 근거: D-042, PRD 7절 R-M-009.

### 1. 필드

| 필드 | 뜻 | 타입 | 필수 | 입력 규칙 | 근거 |
| --- | --- | --- | --- | --- | --- |
| `id` | 좋아요 번호 | `INTEGER PRIMARY KEY` | 자동 | — | 1절 공통 규칙 |
| `trip_id` | 좋아요를 누른 여행 | `INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE` | 필수 | 있는 여행의 `id`. 여행을 지우면 DB가 함께 지운다 | D-042 |
| `user_id` | 좋아요를 누른 회원 | `INTEGER NOT NULL REFERENCES users(id)` | 필수 | 로그인한 회원의 `id`를 라우터가 넣는다 | D-042 |
| `created_at` | 누른 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | 기록용 | 1절 |
| `updated_at` | 마지막으로 고친 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | 좋아요 줄은 고치지 않고 더하고 지우므로 만든 시각과 같다 | 1절 |

- 테이블 끝에 `UNIQUE (trip_id, user_id)`를 둔다. 한 회원은 한 여행에 좋아요를 한 번만 누른다.

### 2. 순서

- 누른 사람 목록을 보이지 않으므로 정하지 않는다. 화면에는 개수만 보인다 (PRD 7절 6번).

### 3. 지키는 규칙

- 좋아요를 취소하면 그 줄을 지운다.
- 내 여행에도 누를 수 있다 (PRD R-M-009).

### 4. 다른 문서로 넘길 것

| 내용 | 문서 |
| --- | --- |
| 누르기·취소 API, 여행 객체의 좋아요 수와 내가 눌렀는지 | `API-SPEC` 2·8절 |

### 5. 열린 질문

지금은 없다.

## 9. `trip_comments` (담당: 팀 공동)

> 근거: D-042, PRD 7절 R-M-010, R-M-011.

### 1. 필드

| 필드 | 뜻 | 타입 | 필수 | 입력 규칙 | 근거 |
| --- | --- | --- | --- | --- | --- |
| `id` | 댓글 번호 | `INTEGER PRIMARY KEY` | 자동 | — | 1절 공통 규칙 |
| `trip_id` | 댓글을 단 여행 | `INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE` | 필수 | 있는 여행의 `id`. 여행을 지우면 DB가 함께 지운다 | D-042 |
| `user_id` | 댓글을 쓴 회원 | `INTEGER NOT NULL REFERENCES users(id)` | 필수 | 로그인한 회원의 `id`를 라우터가 넣는다 | D-042 |
| `content` | 댓글 내용 | `TEXT NOT NULL` | 필수 | 1~200자. 줄바꿈 된다 | PRD 7절 3번 |
| `created_at` | 쓴 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | 화면에 보인다 | 1절, PRD 7절 4번 |
| `updated_at` | 마지막으로 고친 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | 댓글은 고치지 않으므로 만든 시각과 같다 | 1절 |

### 2. 순서

- 한 여행의 댓글: `id`가 작은 것(먼저 쓴 것)이 위다 (PRD 7절 4번, AI 제안).

### 3. 지키는 규칙

- 댓글은 쓴 회원만 지운다. 여행 주인도 남의 댓글을 지우지 않는다 (PRD 7절 6번).
- 댓글을 고치지 않는다 (D-042).

### 4. 다른 문서로 넘길 것

| 내용 | 문서 |
| --- | --- |
| 댓글 목록·쓰기·지우기 API와 응답의 쓴 사람 정보 | `API-SPEC` 9절 |

### 5. 열린 질문

- 200자는 AI 제안이다 (PRD M-01).
