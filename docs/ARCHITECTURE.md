# 구조 문서 (ARCHITECTURE)

> 부품과 책임을 적는다. 한 파일 안에 담당자별 절로 쓰는 것과 고치는 규칙은 D-007을 따른다.
> "제안"이나 "미정"이 붙은 내용은 확정이 아니다. 정하면 `docs/DECISIONS.md`에 기록한 뒤 이 문서를 고친다.

## 1. 부품 한눈에

```text
[브라우저] React 화면 (5173)
   │  화면 주소는 React Router로 나눔: / · /trip · /place · /diary
   │  서버 호출은 frontend/src/api/ 안에서만 (기능별 파일 하나씩)
   ▼
[Vite 개발 서버 프록시]  /api 로 시작하는 요청만 백엔드로 넘김
   ▼
[서버] FastAPI (8000)
   │  라우터를 기능별 파일로 나눔: trips / places / diaries
   ▼
[DB] SQLite (sqlite3로 접근)
      places, diaries는 trip_id로 trips에 연결
```

| 부품 | 책임 | 근거 |
| --- | --- | --- |
| React 화면 | 화면 표시, 사용자 입력. 화면마다 빈 상태·로딩·오류 처리 | AGENTS 코드 규칙 |
| `frontend/src/api/` | 서버 호출. 이 폴더 밖에서는 서버를 부르지 않는다 | AGENTS 코드 규칙 |
| Vite 프록시 | `/api`로 시작하는 요청을 백엔드(8000)로 넘김 | D-011 |
| FastAPI 라우터 | 기능별 요청 처리 (`trips` / `places` / `diaries`) | AGENTS 코드 규칙 |
| SQLite | 여행·장소·일기 저장 | AGENTS 환경, D-009 |

## 2. 기술 스택

| 영역 | 사용 | 상태 |
| --- | --- | --- |
| 프론트엔드 | React | 확정 |
| 빌드 도구 | Vite | 확정 (D-008) |
| 스타일 | CSS Module + 공통 토큰 파일 | 확정 (D-008) |
| 화면 주소 | React Router | 확정 (D-012). 설치는 따로 승인 |
| 백엔드 | FastAPI | 확정 |
| DB | SQLite | 확정 |
| DB 접근 방식 | `sqlite3` | 확정 (D-009) |
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

`frontend/`, `backend/` 안쪽 구조는 아래와 같다 (D-010, D-013).

```text
frontend/
├─ vite.config.js     프록시 설정 (팀 공동)
└─ src/
   ├─ App.jsx         화면 주소 등록 (팀 공동)
   ├─ api/            trips.js · places.js · diaries.js   ← 서버 호출은 여기서만
   ├─ pages/
   │  ├─ Home/        은희
   │  ├─ Trips/       서준
   │  ├─ Places/      은희
   │  └─ Diary/       건용
   ├─ components/     공통 컴포넌트
   │  └─ Layout/      공통 레이아웃, 네비 포함 (건용)
   └─ styles/         tokens.css · global.css (팀 공동)
backend/
├─ main.py            앱 생성, 라우터 등록 (건용)
├─ database.py        SQLite 연결 (건용)
├─ routers/
│  ├─ trips.py        서준
│  ├─ places.py       은희
│  └─ diaries.py      건용
└─ requirements.txt
```

- 변수·함수 이름 같은 일반 이름 규칙은 미정이다 (AGENTS).

## 4. 공통 파일과 담당자

| 구분 | 파일 | 담당 | 근거 |
| --- | --- | --- | --- |
| 라우터 등록 | `backend/main.py` | 건용 | D-004 |
| DB 설정 | `backend/database.py` | 건용 | D-004 |
| 화면 레이아웃 (네비 포함) | `frontend/src/components/Layout/` | 건용 | D-004, D-010 |
| 공통 스타일 | `frontend/src/styles/tokens.css`, `global.css` | 팀 공동 (합의 후 수정) | D-010 |
| 프록시 설정 | `frontend/vite.config.js` | 팀 공동 (합의 후 수정) | D-010, D-011 |
| 화면 주소 등록 | `frontend/src/App.jsx` | 팀 공동 (합의 후 수정) | D-013 |
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
| 백엔드를 부르는 방식 | Vite 개발 서버 프록시. `api/` 파일은 `/api/...` 상대 주소만 쓰고 서버 포트를 적지 않는다 | 확정 (D-011) |
| API 주소 규칙 | `/api`로 시작한다. 화면 주소(`/trip` 등)와 겹치지 않게 하기 위해서다 | 확정 (D-011) |
| 백엔드 라우터 | `trips` / `places` / `diaries` 기능별 파일 | 확정 (AGENTS) |
| 데이터 연결 | `places`와 `diaries`는 `trip_id`로 `trips`에 연결 | 확정 (AGENTS) |
| 날짜 형식 | `YYYY-MM-DD` | 확정 (AGENTS) |
| API 주소, 메서드, 요청·응답 모양 | `docs/API-SPEC.md`에서 정한다 | 미정 |
| 테이블 구조 | `docs/DATA-MODEL.md`에서 정한다 | 미정 |

Home은 세 기능의 API를 가져다 쓰기만 한다 (PRD 5절 Home "5. 다른 기능과의 연결"). 어떤 API를 쓰는지는 `docs/API-SPEC.md`에 적는다.

## 6. 화면 주소와 공통 레이아웃

| 항목 | 내용 | 상태 |
| --- | --- | --- |
| 화면 주소를 나누는 방법 | React Router | 확정 (D-012). 새 라이브러리라 설치 전에 승인 필요 |
| 화면 주소를 등록하는 파일 | `frontend/src/App.jsx` (팀 공동) | 확정 (D-013) |
| Home | `/` | 확정 (README, PRD, D-012) |
| 여행기록 | `/trip` | 확정 (D-012) |
| 여행지 정보 | `/place` | 확정 (D-012) |
| 여행 다이어리 | `/diary` | 확정 (D-012) |
| 각 화면 안쪽 주소 (여행 상세·추가 등) | 그 기능의 담당자가 정한다. 여행기록: 상세 `/trip/:id`, 추가 `/trip/new`, 수정 `/trip/:id/edit` | 여행기록은 정함 (`docs/SCREEN-SPEC.md` 3절). 나머지는 미정 (D-012) |
| 네비 메뉴 | trip · place · diary 3개 (PRD L-07) | 확정 (D-012) |
| 반응형 구조 | 화면 폭 768px을 기준으로 모바일·PC를 나눈다. 모바일에서도 네비는 맨 위 가로 한 줄 | 정함 (`docs/SCREEN-SPEC.md` 2절) |
| "새 여행 만들기" 버튼이 가는 곳 | 여행 추가 화면 `/trip/new`. 저장은 그 화면에서 서버를 부른다 (PRD H-04) | 정함 (`docs/SCREEN-SPEC.md` 3절) |

## 7. 열린 질문

지금은 없다.
