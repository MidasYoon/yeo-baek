# 구조 문서 (ARCHITECTURE)

> 부품과 책임을 적는다. 한 파일 안에 담당자별 절로 쓰는 것과 고치는 규칙은 D-007을 따른다.
> "제안"이나 "미정"이 붙은 내용은 확정이 아니다. 정하면 `docs/DECISIONS.md`에 기록한 뒤 이 문서를 고친다.

## 1. 부품 한눈에

```text
[브라우저] React 화면 (5173)
   │  서버 호출은 frontend/src/api/ 안에서만 (기능별 파일 하나씩)
   ▼
[서버] FastAPI (8000)
   │  라우터를 기능별 파일로 나눔: trips / places / diaries
   ▼
[DB] SQLite
      places, diaries는 trip_id로 trips에 연결
```

| 부품 | 책임 | 근거 |
| --- | --- | --- |
| React 화면 | 화면 표시, 사용자 입력. 화면마다 빈 상태·로딩·오류 처리 | AGENTS 코드 규칙 |
| `frontend/src/api/` | 서버 호출. 이 폴더 밖에서는 서버를 부르지 않는다 | AGENTS 코드 규칙 |
| FastAPI 라우터 | 기능별 요청 처리 (`trips` / `places` / `diaries`) | AGENTS 코드 규칙 |
| SQLite | 여행·장소·일기 저장 | AGENTS 환경 |

## 2. 기술 스택

| 영역 | 사용 | 상태 |
| --- | --- | --- |
| 프론트엔드 | React | 확정 |
| 빌드 도구 | Vite | 제안 (미정) |
| 스타일 | CSS Module + 공통 토큰 파일 | 제안 (미정) |
| 백엔드 | FastAPI | 확정 |
| DB | SQLite | 확정 |
| DB 접근 방식 | `sqlite3` 또는 SQLAlchemy | 미정 |
| 버전, 설치·실행 명령 | — | 미정 |

React · FastAPI · SQLite 외의 프레임워크·DB는 쓰지 않는다.

## 3. 폴더 구조

최상위 폴더는 README와 같다.

```text
yeo-back/
├── frontend/   # React 프론트엔드
├── backend/    # FastAPI 백엔드
└── docs/       # 프로젝트 문서
```

`frontend/`, `backend/` 안쪽 구조는 **제안**이다 (README와 같음). 뼈대를 만든 뒤 실제 구조로 고친다.

```text
frontend/
└─ src/
   ├─ api/            trips.js · places.js · diaries.js   ← 서버 호출은 여기서만
   ├─ pages/
   │  ├─ Home/        은희
   │  ├─ Trips/       서준
   │  ├─ Places/      은희
   │  └─ Diary/       건용
   ├─ components/     공통 컴포넌트
   └─ styles/         tokens.css · global.css (공통 파일)
backend/
├─ main.py            앱 생성, 라우터 등록 (공통 파일)
├─ database.py        SQLite 연결 (공통 파일)
├─ routers/
│  ├─ trips.py        서준
│  ├─ places.py       은희
│  └─ diaries.py      건용
└─ requirements.txt
```

- 확정: `frontend/src/api/`에 기능별 파일 하나씩, 백엔드 라우터는 `trips` / `places` / `diaries` 기능별 파일 (AGENTS 코드 규칙)
- 제안: 그 밖의 파일 이름과 폴더 이름 (이름 규칙은 미정)

## 4. 공통 파일과 담당자

| 구분 | 파일 (제안 위치) | 담당 | 근거 |
| --- | --- | --- | --- |
| 라우터 등록 | `backend/main.py` | 건용 | D-004 |
| DB 설정 | `backend/database.py` | 건용 | D-004 |
| 화면 레이아웃 (네비 포함) | 미정 | 건용 | D-004 |
| 공통 스타일 | `frontend/src/styles/` | 미정 (스타일 방식이 미정) | — |
| 첫 화면 Home (`/`) | `frontend/src/pages/Home/` | 은희 | D-004 |
| 여행기록 화면·API 호출·라우터 | `pages/Trips/`, `api/trips.js`, `routers/trips.py` | 서준 | AGENTS 역할 분담 |
| 여행지 정보 화면·API 호출·라우터 | `pages/Places/`, `api/places.js`, `routers/places.py` | 은희 | AGENTS 역할 분담 |
| 여행 다이어리 화면·API 호출·라우터 | `pages/Diary/`, `api/diaries.js`, `routers/diaries.py` | 건용 | AGENTS 역할 분담 |

- 자기 담당 밖의 파일을 고쳐야 하면 담당자에게 먼저 묻는다 (AGENTS).

## 5. 화면과 서버의 연결 방식

| 항목 | 내용 | 상태 |
| --- | --- | --- |
| 포트 | 백엔드 8000, 프론트엔드 5173 | 확정 (AGENTS) |
| 서버 호출 위치 | `frontend/src/api/` 안의 기능별 파일에서만 | 확정 (AGENTS) |
| 백엔드 라우터 | `trips` / `places` / `diaries` 기능별 파일 | 확정 (AGENTS) |
| 데이터 연결 | `places`와 `diaries`는 `trip_id`로 `trips`에 연결 | 확정 (AGENTS) |
| 날짜 형식 | `YYYY-MM-DD` | 확정 (AGENTS) |
| 프론트엔드가 백엔드를 부르는 방식 (포트가 달라서 생기는 문제를 CORS 허용으로 풀지, 개발 서버 프록시로 풀지) | — | 미정 |
| API 주소, 메서드, 요청·응답 모양 | `docs/API-SPEC.md`에서 정한다 | 미정 |
| 테이블 구조 | `docs/DATA-MODEL.md`에서 정한다 | 미정 |

Home은 세 기능의 API를 가져다 쓰기만 한다 (PRD 5절 Home "5. 다른 기능과의 연결"). 어떤 API를 쓰는지는 `docs/API-SPEC.md`에 적는다.

## 6. 화면 주소와 공통 레이아웃

| 항목 | 내용 | 상태 |
| --- | --- | --- |
| 첫 화면 주소 | `/` (Home) | 확정 (README, PRD) |
| 기능별 화면 주소 | — | 미정 |
| 화면 주소를 나누는 방법 (라우팅 라이브러리 사용 여부) | — | 미정 (새 라이브러리면 설치 전 승인 필요) |
| 네비 메뉴 | trip · place · diary 3개 메뉴 (PRD L-07) | 미정 (팀 확인 필요) |
| 반응형 구조 | — | 미정 (PRD L-07) |
| "새 여행 만들기" 버튼이 가는 곳 | 여행 추가 화면. 주소가 없으면 trip 메뉴 (PRD H-04) | 미정 (서준 확인 필요) |

## 7. 열린 질문

| 질문 | 관련 | 함께 볼 사람 |
| --- | --- | --- |
| 빌드 도구 (Vite는 제안) | 2절 | 전원 |
| 스타일 방식과 공통 스타일 파일 담당 | 2절, 4절 | 전원 |
| DB 접근 방식 (`sqlite3` 또는 SQLAlchemy) | 2절 | 건용 |
| `frontend/`, `backend/` 안쪽 폴더·파일 이름 (이름 규칙 미정) | 3절 | 전원 |
| 화면 레이아웃 파일 위치 | 4절 | 건용 |
| 프론트엔드가 백엔드를 부르는 방식 (CORS 또는 프록시) | 5절 | 건용 |
| 기능별 화면 주소와 주소를 나누는 방법 | 6절 | 전원 |
| 네비 메뉴와 반응형 구조 | 6절, PRD L-07 | 건용 |
| "새 여행 만들기" 버튼의 이동 주소 | 6절, PRD H-04 | 서준 |
