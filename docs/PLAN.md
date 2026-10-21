# 작업 계획

## 이번 목표와 범위

- **목표:** 무엇을, 어떻게 만들지 문서로 정한다.
- **범위 안:** 설계 문서 작성 (PRD, ARCHITECTURE, SCREEN-SPEC, DATA-MODEL, API-SPEC, TEST-PLAN)
- **범위 밖:** 코드 작성, 패키지·도구 설치, `docs/DESIGN.md` (이번 MVP에서 만들지 않음)
- **참고 문서**

  | 문서 | 상태 |
  | --- | --- |
  | `README.md` | 있음 |
  | `AGENTS.md` | 있음 |
  | `docs/DECISIONS.md` | 있음 |
  | `docs/PRD.md` | 있음 |
  | `docs/ARCHITECTURE.md` | 있음 |
  | `docs/SCREEN-SPEC.md` | 있음 |
  | `docs/DATA-MODEL.md` | 있음 |
  | `docs/API-SPEC.md` | 있음 |
  | `docs/TEST-PLAN.md` | 있음 |

- 문서를 누가 어떻게 나눠 쓰는지는 `docs/DECISIONS.md`의 D-007을 따른다.

## 작업 목록

| 번호 | 작업 | 완료 조건 | 상태 |
| --- | --- | --- | --- |
| P-01 | README 작성 | `README.md`를 열면 프로젝트 소개, 현재 상태, 주요 기능, 만들지 않는 것, 팀, 실행 방법(제안)이 보인다 | 완료 |
| P-02 | AGENTS 작성 | 새 대화에서 AI가 `AGENTS.md` 규칙을 설명하고, 없는 파일은 없다고 말한다 | 완료 |
| P-03 | DECISIONS D-001~D-007 기록 | `docs/DECISIONS.md`를 열면 D-001~D-007의 결정, 상태, 날짜가 보인다 | 완료 |
| P-04 | PRD 작성 | `docs/PRD.md`를 열면 여행기록, 여행지 정보, 여행 다이어리, Home 절이 있다. "만들지 않는 것" 목록이 README와 같다 | 완료 |
| P-05 | ARCHITECTURE 작성 | `docs/ARCHITECTURE.md`를 열면 폴더 구조, 공통 파일과 담당자, 화면과 서버의 연결 방식이 보인다. 정하지 않은 항목은 "미정"으로 표시돼 있다 | 완료 |
| P-06 | SCREEN-SPEC 작성 | `docs/SCREEN-SPEC.md`를 열면 담당자별 절(여행기록, 여행지 정보, 다이어리, Home, 공통 레이아웃)마다 보이는 것, 할 수 있는 행동, 빈 상태·로딩·오류 표시가 있다 | 완료 |
| P-07 | DATA-MODEL 작성 | `docs/DATA-MODEL.md`를 열면 `trips`, `places`, `diaries`의 필드 이름과 뜻이 보인다. `places`와 `diaries`에 `trip_id`가 있다 | 완료 |
| P-08 | API-SPEC 작성 | `docs/API-SPEC.md`를 열면 기능별 주소, 메서드, 요청·응답 모양이 보인다. Home이 쓰는 API가 표시돼 있다 | 완료 |
| P-09 | TEST-PLAN 작성 | `docs/TEST-PLAN.md`를 열면 기능별 검사 항목과 기대 결과가 있다. 기능 사이 연결·회귀 검사를 다루는 공통 절이 있다 | 완료 |

## 실제 검증 결과

사람이 직접 확인한 것만 적는다.

| 번호 | 확인한 방법 | 결과 |
| --- | --- | --- |
| P-01 | `README.md` 파일을 열어 내용을 확인함 | 확인함 |
| P-02 | 새 대화에서 AI가 규칙을 설명하고, 없는 파일은 없다고 말하는 것을 확인함 | 확인함 |
| P-03 | `docs/DECISIONS.md` 파일을 열어 D-001~D-007 내용을 확인함 | 확인함 (D-006의 은희 확인은 미확인) |
| P-04 | `docs/PRD.md` 파일을 열어 절과 "만들지 않는 것" 목록을 확인함 | 확인함 |
| P-05 | `docs/ARCHITECTURE.md`와 함께 고친 `docs/DECISIONS.md`·`AGENTS.md`·`README.md`·`docs/PLAN.md`를 열어 확인함 | 확인함 |
| P-06 | `docs/SCREEN-SPEC.md`와 함께 고친 `docs/PRD.md`·`docs/ARCHITECTURE.md`·`docs/DECISIONS.md`를 열어 담당자별 절과 빈 상태·로딩·오류 표시를 확인함 | 확인함 |
| P-07 | `docs/DATA-MODEL.md`와 함께 고친 `docs/DECISIONS.md`(D-015~D-017)·`docs/PRD.md`·`docs/PLAN.md`·`README.md`·`docs/ARCHITECTURE.md`를 열어 확인함 | 확인함 |
| P-08 | `docs/API-SPEC.md`와 함께 고친 `docs/DECISIONS.md`(D-018~D-020)·`docs/PRD.md`·`docs/SCREEN-SPEC.md`·`docs/ARCHITECTURE.md`·`README.md`·`docs/PLAN.md`를 열어 확인함 | 확인함 |
| P-09 | `docs/TEST-PLAN.md`와 함께 고친 `docs/DECISIONS.md`(D-021·D-022)·`docs/SCREEN-SPEC.md`·`docs/API-SPEC.md`·`docs/PLAN.md`·`README.md`를 열어 확인함 | 확인함 |

## 남은 문제와 다음 행동

**아직 정하지 않은 것** (정하면 `docs/DECISIONS.md`에 기록)

- 이름 규칙 (DB 필드는 snake_case로 정함, D-016. 코드 이름 규칙은 미정)
- 브랜치 이름 규칙
- 버전, 설치·실행 명령
- 지도 화면 방식과 핀 위치 저장 방법 — 보류 중
- 입력 검증 규칙 (빈 값 허용 여부, 종료일이 시작일보다 빠를 때) — PRD에 초안 있음, 팀 확인 후 DECISIONS에 기록. 공백만 적은 값은 서버가 `422`로 막는다 (D-021)
- 다이어리 기분 목록 — PRD에 초안 있음, 팀 확인 후 DECISIONS에 기록
- 여행기록의 "여행 정보"에 무엇을 적을지 — PRD에 초안 있음, 팀 확인 후 DECISIONS에 기록
- `PUT` 검사 순서 — `docs/API-SPEC.md` 1절 열린 질문 A-02

**정리할 것**

- `README.md`의 "기획서와 디자인 가이드 같은 다른 문서는 `docs/` 폴더에 둡니다" 문구가 실제 위치(`backup/`, Git 제외)와 다르다.
- 지금까지 커밋은 PR 절차 없이 `master`에 바로 넣었다. 팀원에게 알려야 한다.
- `docs/PRD.md` "절 사이 맞춤" 10가지를 담당자가 확인한 뒤 `docs/DECISIONS.md`에 기록한다.
- ARCHITECTURE를 "다 같이 쓴다"는 것이 D-007의 "`ARCHITECTURE` 초안은 건용이 쓴다"와 다르다. 팀이 정하면 DECISIONS에 새 번호로 기록한다.
- `README.md` 폴더 구조 아래의 "공통 파일을 고칠 때는 팀에 먼저 알립니다"가 팀 공동 파일의 "합의 후 수정"(D-010)과 다르다.
- `docs/API-SPEC.md`의 "(AI 제안)" 표시(성공 코드 201·204, `PUT` 본문에서 `trip_id` 빼기, 검사 순서 등)를 담당자가 확인한다.
- `docs/TEST-PLAN.md`의 "(AI 제안)" 표시는 근거 문서의 AI 제안을 그대로 쓴 것이다. 담당자가 근거 문서의 표시를 정리하면 TEST-PLAN도 함께 고친다.
- `docs/SCREEN-SPEC.md` 5절 6번의 시각 저장 형식 줄에 남은 "(AI 제안)" 표시를 정리한다 (D-016으로 확정).
- 원본 PRD 파일(`PRD_1.md`, `PRD_3.md`, `check.md`, `prd2_1.md`, `prd2_2.md`)을 정리할지 정한다.

**다음 행동**

- 설계 문서 작성(P-01~P-09)을 마쳤다. 다음 목표와 범위(예: 코드 뼈대 만들기)는 팀이 정해 이 PLAN을 고친다.
