# 데이터 모델 (DATA-MODEL)

> 저장할 정보의 이름과 뜻을 적는다. 무엇을 만들지는 `docs/PRD.md`, 구조는 `docs/ARCHITECTURE.md`를 따른다.
> 한 파일 안에 담당자별 절로 쓰고, 담당자별 절도 팀이 합의한 뒤에만 고친다 (D-007).
> 테이블별 절(2~4)은 모두 같은 목차 1~5를 따른다. 근거가 되는 PRD·SCREEN-SPEC 번호를 괄호로 적는다.
> API 주소와 요청·응답 모양은 적지 않는다 (`docs/API-SPEC.md` 몫).
> "제안"이나 "확인 필요"가 붙은 내용은 확정이 아니다.

## 1. 공통 (팀 합의)

### 테이블 목록

| 테이블 | 담는 것 | 담당 | 근거 |
| --- | --- | --- | --- |
| `trips` | 여행 한 건 | 서준 | D-001 |
| `places` | 여행에서 방문한 장소 한 곳 | 은희 | D-002 |
| `diaries` | 여행 중 쓴 일기 한 편 | 건용 | D-003 |

### 테이블 사이의 연결

```text
trips (1) ──< places  (여러 개)   places.trip_id  → trips.id
      (1) ──< diaries (여러 개)   diaries.trip_id → trips.id
```

- 장소와 일기는 꼭 한 여행에 속한다. `trip_id`는 비울 수 없다.
- `places`와 `diaries`는 서로 연결하지 않는다.

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

### 장소·일기가 붙은 여행 지우기 막기 (R-T-012)

장소나 일기가 하나라도 붙은 여행은 지울 수 없다. 두 곳에서 함께 막는다. (D-015)

| 막는 곳 | 방법 | 하는 일 |
| --- | --- | --- |
| DB | `places.trip_id`, `diaries.trip_id`를 `REFERENCES trips(id) ON DELETE RESTRICT`로 둔다. `backend/database.py`(건용)가 DB에 연결할 때마다 `PRAGMA foreign_keys = ON`을 켠다 | 다른 길로 지우려 해도 DB가 거절한다 |
| `trips` 라우터 | 지우기 전에 그 여행의 장소 개수와 일기 개수를 센다. 하나라도 있으면 지우지 않는다 | 화면 안내 문구에 쓸 개수를 얻는다 (SCREEN-SPEC 3절 4번) |

- SQLite는 `PRAGMA foreign_keys = ON`을 켜지 않으면 외래 키를 검사하지 않는다. 연결마다 켜야 한다.
- 라우터가 돌려주는 응답 모양과 개수를 얻는 방법은 `docs/API-SPEC.md`에서 정한다.

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
| `created_at` | 만든 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | `YYYY-MM-DD HH:MM:SS`. 기록용 | 1절 |
| `updated_at` | 마지막으로 고친 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | `YYYY-MM-DD HH:MM:SS`. 고칠 때 라우터가 넣는다 | 1절 |

### 2. 순서

- `start_date`가 늦은 것이 위, 같으면 `id`가 큰 것이 위다. (R-T-007, R-T-016)
- Home 최근 여행(A)은 이 순서의 첫 번째를 쓴다. (H-01)

### 3. 지키는 규칙

- 장소·일기가 붙은 여행은 지울 수 없다. (R-T-012, 1절)
- 기간을 고칠 때, 그 여행의 `places.visit_date`나 `diaries.date` 중 새 기간 밖의 것이 하나라도 있으면 고칠 수 없다. (R-T-017)

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
| `region` | 지역 (시·도) | `TEXT NOT NULL` | 필수 | 아래 시·도 17개 이름 중 하나를 그대로 저장한다 | PRD 3절 3번, SCREEN-SPEC 4절 6번 |
| `name` | 장소 이름 | `TEXT NOT NULL` | 필수 | 20자 이하 | PRD 3절 3번 |
| `visit_date` | 방문 날짜 | `TEXT NOT NULL` | 필수 | `YYYY-MM-DD`. 그 여행의 `start_date`~`end_date` 안 | PRD 3절 3번 |
| `memo` | 메모 | `TEXT` | 선택 | 20자 이하, 한 줄 | PRD 3절 3번 |
| `created_at` | 만든 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | `YYYY-MM-DD HH:MM:SS`. 기록용 | 1절 |
| `updated_at` | 마지막으로 고친 시각 | `TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))` | 자동 | `YYYY-MM-DD HH:MM:SS`. 고칠 때 라우터가 넣는다 | 1절 |

- `region`에 저장하는 값 (D-016): 서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종, 경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주
- 핀 좌표는 저장하지 않는다. 핀은 `region`으로 정한 시·도 가운데에 찍는다. (R-P-005, 좌표표는 개발 단계)

### 2. 순서

- 한 여행의 장소: `visit_date`가 오래된 것이 앞, 같으면 `id`가 작은 것이 앞이다. (L-11, R-P-009)
- Home 최근 장소(B): 모든 여행에서 `visit_date`가 늦은 것, 같으면 `id`가 큰 것 1개. (H-02, H-05)

### 3. 지키는 규칙

- 장소가 있는 여행은 지울 수 없다. (R-T-012, 1절)

### 4. 다른 문서로 넘길 것

| 내용 | 문서 |
| --- | --- |
| `region`이 17개 이름 중 하나인지, 20자·기간 안 검사를 서버도 하는지와 오류 응답 모양 | `API-SPEC` |
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

- 한 여행의 일기: `date`·`time`이 오래된 것이 위, 같으면 `id`가 작은 것이 위다. (R-D-008)
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
