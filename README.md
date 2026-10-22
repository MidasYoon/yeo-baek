# 여백 (yeo-back)

여행 한 건을 기록하고, 방문한 곳은 **지도와 목록**으로, 그날의 이야기는 **날짜별 일기**로 모아 보는 여행 다이어리 웹앱입니다.
3~4일 바이브 코딩 팀 프로젝트 MVP입니다.

## 현재 상태

- 구현 단계입니다. 화면 틀(`frontend/`: 네비와 빈 화면 4개, 없는 주소 화면)을 만들었습니다. 서버 틀(`backend/`)과 테이블 3개(`trips`, `places`, `diaries`)를 만들었습니다. 목록 API 3개와 화면·서버 연결(Vite 프록시)을 만들었습니다. 공통 부품 4개(버튼, 상태 표시, 지우기 확인 창, 여행 select)를 만들었습니다. 여행기록 API(목록·하나·만들기·고치기·지우기)와 여행 목록·추가·상세·수정·삭제 화면(`/trip`, `/trip/new`, `/trip/:id`, `/trip/:id/edit`)을 만들었습니다. 여행 상세 안의 장소·일기 목록은 아직 없습니다. 장소 API(목록·최근 1개·하나·만들기·고치기·지우기)와 장소 목록·추가·수정·삭제 화면(`/place`, `/place?trip=`, `/place/new?trip=`, `/place/:id/edit`)과 지도·핀을 만들었습니다.
- 제품 요구 문서(`docs/PRD.md`)를 작성했습니다.
- 구조 문서(`docs/ARCHITECTURE.md`)를 작성했습니다.
- 화면 명세(`docs/SCREEN-SPEC.md`)를 작성했습니다.
- 데이터 모델(`docs/DATA-MODEL.md`)을 작성했습니다.
- API 명세(`docs/API-SPEC.md`)를 작성했습니다.
- 시험 계획(`docs/TEST-PLAN.md`)을 작성했습니다.
- 디자인 문서(`docs/DESIGN.md`)를 작성했습니다. 화면 모양은 "한지 노을" 시안을 따릅니다 (D-023).
- 앱 안에는 AI 기능을 넣지 않습니다.

## 주요 기능

```text
여행기록 (서준)             여행명, 여행지, 기간, 여행 정보
 ├─ 여행지 정보 (은희)      지도(핀) + 목록
 └─ 여행 다이어리 (건용)    날짜별 일기 + 기분
```

- **여행기록**: 여행명, 여행지, 기간, 여행 정보를 기록합니다.
- **여행지 정보**: 방문한 여행지를 지도와 목록으로 보여 줍니다.
- **여행 다이어리**: 여행 중 날짜별로 일기를 씁니다.
- 장소와 일기는 `trip_id`로 여행에 연결됩니다.
- 첫 화면(Home, `/`)은 세 기능의 데이터를 모아 보여 주는 화면입니다.
- **만들지 않는 것:** 로그인, 실시간 위치 추적, 지도 API·길찾기, 날씨 API, 외부 장소 검색, 여행지 추천, 통계·차트, 검색·필터·별점, 사진 업로드

## 팀

| 이름 | 담당 |
| --- | --- |
| 서준 | 여행기록 |
| 은희 | 여행지 정보 |
| 건용 | 여행 다이어리 |

- 공통 파일(라우터 등록 `backend/main.py`, 화면 레이아웃, DB 설정) 관리자: 건용
- 공통 스타일 파일(`tokens.css`, `global.css`), `vite.config.js`, `App.jsx`, 공통 부품(`components/`, `Layout/` 제외), 그림(`assets/`): 팀 공동 관리, 합의 후 수정 (D-010, D-013, D-028, D-030)
- 첫 화면(Home) 담당: 은희

## 기술 스택

| 영역 | 사용 | 상태 |
| --- | --- | --- |
| 프론트엔드 | React | 확정 |
| 빌드 도구 | Vite | 확정 (D-008) |
| 스타일 | CSS Module + 공통 토큰 파일 | 확정 (D-008) |
| 화면 주소 | React Router | 확정 (D-012) |
| 백엔드 | FastAPI (Python 3.10+) | 확정 |
| DB | SQLite | 확정 |
| DB 접근 방식 | `sqlite3` | 확정 (D-009) |

React · FastAPI · SQLite 외의 프레임워크·DB는 쓰지 않습니다.

## 폴더 구조

```text
yeo-back/
├── frontend/   # React 프론트엔드
├── backend/    # FastAPI 백엔드
├── docs/       # 프로젝트 문서
├── README.md   # 프로젝트 소개 (지금 보고 있는 문서)
├── AGENTS.md   # AI가 일할 때 지킬 규칙
└── CLAUDE.md   # Claude Code가 AGENTS.md를 자동으로 읽게 하는 파일
```

`frontend/`, `backend/` 안쪽 구조는 아래와 같습니다 (D-010, D-013).

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
   ├─ components/     공통 컴포넌트 (팀 공동, D-028)
   ├─ assets/         지도 그림 등 (팀 공동, D-030)
   │  └─ Layout/      공통 레이아웃, 네비 포함 (공통 파일). 없는 주소 화면 NotFound.jsx도 여기 (D-025)
   └─ styles/         tokens.css · global.css (팀 공동)
backend/
├─ main.py            앱 생성, 라우터 등록 (공통 파일)
├─ database.py        SQLite 연결 (공통 파일)
├─ routers/
│  ├─ trips.py        서준
│  ├─ places.py       은희
│  └─ diaries.py      건용
└─ requirements.txt
```

- 자기 담당 폴더·파일만 수정합니다. 공통 파일을 고칠 때는 팀에 먼저 알립니다.

## 프로젝트 문서

| 문서 | 내용 |
| --- | --- |
| `README.md` | 프로젝트 소개와 시작 안내 (지금 보고 있는 문서) |
| `AGENTS.md` | AI가 일할 때 지킬 규칙 |
| `CLAUDE.md` | `AGENTS.md`를 불러오는 한 줄 파일 |
| `docs/DECISIONS.md` | 팀이 확정한 결정과 그 이유 |
| `docs/PLAN.md` | 할 일, 상태, 확인 결과, 다음 행동 |
| `docs/PRD.md` | 무엇을 만들지 (기능별 요구사항) |
| `docs/ARCHITECTURE.md` | 어떤 구조로 만들지 (부품과 책임) |
| `docs/SCREEN-SPEC.md` | 화면에서 보이는 것과 할 수 있는 행동 (담당자별 절) |
| `docs/DATA-MODEL.md` | 저장할 정보의 이름과 뜻 (테이블별 절) |
| `docs/API-SPEC.md` | 화면과 서버가 주고받는 약속 (기능별 절) |
| `docs/TEST-PLAN.md` | 무엇을 보면 통과인지 (검사 항목과 기대 결과, 기능별 절) |
| `docs/DESIGN.md` | 화면이 어떻게 보이는지 (색, 글자, 여백, 모양 규칙) |

기획서와 디자인 가이드 같은 다른 문서는 `docs/` 폴더에 둡니다.

## 시작 방법

1. 저장소를 내 컴퓨터로 받습니다.

   ```bash
   git clone <저장소 주소>
   ```

2. 프로젝트 폴더로 이동합니다.

   ```bash
   cd yeo-back
   ```

3. `README.md`와 `AGENTS.md`부터 읽습니다.

## 실행 방법

> 아래 버전과 명령은 D-024로 확정했습니다. 코드가 아직 없어 실제로 실행해 보지는 않았습니다.

**준비물:** Python 3.10+, Node.js 20+

**처음 한 번**

```bash
cd backend
python -m venv venv
venv\Scripts\activate          (cmd)
.\venv\Scripts\Activate.ps1    (PowerShell)
pip install -r requirements.txt
```

```bash
cd frontend
npm install
```

**매번 켜기** — 터미널 2개, 백엔드 먼저

| 위치 | 명령 | 주소 |
| --- | --- | --- |
| `backend/` (venv 켠 상태) | `uvicorn main:app --reload --port 8000` | http://localhost:8000/docs |
| `frontend/` | `npm run dev` | http://localhost:5173 |

- 포트는 백엔드 8000(FastAPI 기본값), 프론트엔드 5173(Vite 기본값)으로 확정했습니다.
- PowerShell에서 `Activate.ps1`이 실행 정책 때문에 막히면, venv를 켜지 않고 `backend/`에서 `.\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000`으로 켭니다 (D-026).
- DB 파일(`backend/yeoback.db`, D-026)은 Git에 올리지 않습니다. 데이터를 초기화하려면 서버를 끄고 지운 뒤 다시 켜면 됩니다.

## 확인과 기록

- 작업을 마치면 바뀐 내용을 직접 확인한 다음 커밋합니다.
- 커밋 메시지에는 무엇을 왜 바꿨는지 짧게 적습니다.
- 정해진 내용이나 바뀐 내용이 생기면 이 README에도 반영합니다.
- 작업이 진행되면 "현재 상태"와 "프로젝트 문서"를 실제 파일에 맞게 고칩니다.
- 아직 없는 파일이나 기능은 적지 않습니다.

## 참여 방법

- 기본 브랜치: `master`
- 브랜치 규칙: 미정
- 커밋 규칙: `종류(기능): 내용` 형식으로 적습니다.
  - 예: `feat(place): 장소 카드 목록 표시`, `fix(diary): 날짜 정렬 오류 수정`
- PR 절차: PR을 올리고 다른 팀원 1명이 확인한 뒤 `master`에 합칩니다.
- 공통 문서(README, AGENTS, DECISIONS 등)와 공통 설계 문서(PRD, ARCHITECTURE, DATA-MODEL, API-SPEC): 팀이 합의한 뒤에만 고칩니다. 합의한 뒤에는 누구나 고칠 수 있습니다.

## AI로 작업할 때

AI가 지킬 규칙은 [AGENTS.md](AGENTS.md)에 있습니다. Claude Code는 `CLAUDE.md`를 통해 자동으로 읽습니다.
