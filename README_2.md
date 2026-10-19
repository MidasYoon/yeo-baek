# Yeobaek (여백)

여행 한 건을 기록하고, 방문한 곳은 **지도와 리스트**로, 그날의 이야기는 **일기**로 모아 보는 여행 다이어리 웹앱입니다.
3~4일 바이브 코딩 팀 프로젝트 MVP입니다.

- **현재 단계:** 기획 단계 (코드 없음)

---

## 기능

```text
여행기록 (서준)             여행명, 여행지, 기간, 정보
 ├─ 여행지 정보 (은희)      지도(번호 붙은 핀) + 리스트
 └─ 여행 다이어리 (건용)    날짜별 일기 + 기분
```

- 장소와 일기는 `trip_id`로 여행에 연결됩니다.
- Home(`/`)은 세 기능의 데이터를 모아 보여 주는 화면입니다.
- **만들지 않는 것:** 로그인, 실시간 위치 추적, 지도 API·길찾기, 날씨 API, 외부 장소 검색, 여행지 추천, 통계·차트, 검색·필터·별점, 사진 업로드

---

## 기술 스택

| 영역 | 사용 | 상태 |
|---|---|---|
| 프론트엔드 | React | 확정 |
| 빌드 도구 | Vite | 제안 |
| 스타일 | CSS Module + 공통 토큰 파일 | 제안 |
| 백엔드 | FastAPI (Python 3.10+) | 확정 |
| DB | SQLite | 확정 |
| DB 접근 방식 | `sqlite3` 또는 SQLAlchemy | 미정 |

React · FastAPI · SQLite 외의 프레임워크·DB는 쓰지 않습니다.

---

## 폴더 구조

> ⚠️ 코드가 아직 없어 아래 구조는 **제안**입니다. 뼈대를 만든 뒤 실제 구조로 고쳐 주세요.

```text
travel/
├─ frontend/
│  └─ src/
│     ├─ api/            trips.js · places.js · diaries.js   ← 서버 호출은 여기서만
│     ├─ pages/
│     │  ├─ Home/        서준
│     │  ├─ Trips/       서준
│     │  ├─ Places/      은희
│     │  └─ Diary/       건용
│     ├─ components/     공통 컴포넌트
│     └─ styles/         tokens.css · global.css (서준만 수정)
└─ backend/
   ├─ main.py            앱 생성, 라우터 등록 (서준)
   ├─ database.py        SQLite 연결
   ├─ routers/
   │  ├─ trips.py        서준
   │  ├─ places.py       은희
   │  └─ diaries.py      건용
   └─ requirements.txt
```

- 자기 담당 폴더·파일만 수정합니다. 공통 파일(`main.py`, 라우팅·레이아웃, `styles/`)을 고칠 때는 팀에 먼저 알립니다.

---

## 실행 방법

> ⚠️ 코드가 아직 없어 아래 명령은 **제안**입니다. 뼈대를 만든 뒤 실제 명령으로 고쳐 주세요.

**준비물:** Python 3.10+, Node.js 20+

**처음 한 번**

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

```bash
cd frontend
npm install
```

**매번 켜기** — 터미널 2개, 백엔드 먼저

| 위치 | 명령 | 주소 |
|---|---|---|
| `backend/` (venv 켠 상태) | `uvicorn main:app --reload --port 8000` | http://localhost:8000/docs |
| `frontend/` | `npm run dev` | http://localhost:5173 |

DB 파일(`*.db`)은 Git에 올리지 않습니다. 데이터를 초기화하려면 서버를 끄고 지운 뒤 다시 켜면 됩니다.

---

## AI로 작업할 때

AI가 지킬 규칙은 [AGENTS.md](AGENTS.md)에 있습니다. Claude Code는 `CLAUDE.md`를 통해 자동으로 읽습니다.
