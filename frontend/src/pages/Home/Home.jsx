import { useCallback, useEffect, useState } from 'react'
import { getRecentDiary } from '../../api/diaries.js'
import { getRecentPlace } from '../../api/places.js'
import { getTrips } from '../../api/trips.js'
import hanokImage from '../../assets/hanok-illustration.svg'
import Button from '../../components/Button/Button.jsx'
import { MOOD_EMOJI } from '../Diary/diaryFormat.js'
import RecentBlock from './RecentBlock.jsx'
import styles from './Home.module.css'

// Home (담당: 은희). SCREEN-SPEC 6절, API-SPEC 5절. 주소: /
// A·B·C는 따로 불러오고 따로 보인다. 한 블록이 오류여도 나머지는 그대로 보인다.

// 블록 하나를 불러오는 상태와 다시 부르기
function useRecent(load) {
  const [state, setState] = useState({ status: 'loading', data: null })

  const reload = useCallback(async () => {
    setState({ status: 'loading', data: null })
    try {
      setState({ status: 'done', data: await load() })
    } catch {
      setState({ status: 'error', data: null })
    }
  }, [load])

  useEffect(() => {
    reload()
  }, [reload])

  return [state, reload]
}

// 최근 여행(A)은 여행 목록의 첫 번째다. 빈 목록이면 null (API-SPEC 5절 1번).
const loadRecentTrip = async () => (await getTrips())[0] ?? null

export default function Home() {
  const [trip, reloadTrip] = useRecent(loadRecentTrip)
  const [place, reloadPlace] = useRecent(getRecentPlace)
  const [diary, reloadDiary] = useRecent(getRecentDiary)

  // 여행이 하나도 없으면 첫 방문 화면을 보인다. A 결과만 보고 판단한다 (R-H-012).
  const firstVisit = trip.status === 'done' && trip.data === null

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>여행의 빈칸을 채우는 기록장</p>
          {/* "여백" 이행시: 두 줄의 첫 글자를 한자 旅(여행)·白(백지)로 쓰고 주홍으로 (2026-10-22 사람이 정함).
              화면 읽기 프로그램은 한자 대신 한글로 읽게 aria-label을 둔다. */}
          <h1
            className={styles.headline}
            aria-label="여행으로 채워지는 하루 백지 위에 펼쳐지는 나만의 이야기"
          >
            <span className={styles.headlineLine}>
              <em className={styles.accentLetter} aria-hidden="true">旅</em>행으로 채워지는 하루
            </span>{' '}
            <span className={styles.headlineLine}>
              <em className={styles.accentLetter} aria-hidden="true">白</em>지 위에 펼쳐지는 나만의 이야기
            </span>
          </h1>
          <p className={styles.intro}>
            다녀온 곳은 지도에, 그날의 마음은 일기에. 여행 한 편을 차곡차곡 남겨 보세요.
          </p>
          {/* Home 바로가기만 앞에 + 선 아이콘과 "새 여행 추가" (2026-10-23 사람이 정함) */}
          <div className={styles.heroAction}>
            <Button to="/trip/new">
              <svg className={styles.plus} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              새 여행 추가
            </Button>
          </div>
          {firstVisit && <p className={styles.firstVisit}>첫 여행을 만들어 보세요</p>}
        </div>
        <img className={styles.heroImage} src={hanokImage} alt="" aria-hidden="true" />
      </section>

      {!firstVisit && (
        <section className={styles.recent} aria-labelledby="recent-title">
          <h2 id="recent-title" className={styles.sectionTitle}>
            최근 기록
            <span className={styles.titleRule} aria-hidden="true" />
          </h2>
          <div className={styles.blocks}>
            <RecentBlock
              label="최근 여행"
              tone="trip"
              state={trip}
              to={trip.data ? `/trip/${trip.data.id}` : '/trip'}
              emptyMessage="아직 기록한 여행이 없어요."
              errorMessage="최근 여행을 불러오지 못했어요."
              onRetry={reloadTrip}
              renderCard={(data) => (
                <>
                  <span className={styles.cardTitle}>{data.name}</span>
                  <span className={styles.cardSub}>{data.destination}</span>
                  <span className={styles.cardDate}>
                    {data.start_date} ~ {data.end_date}
                  </span>
                </>
              )}
            />
            <RecentBlock
              label="최근 장소"
              tone="place"
              state={place}
              to={place.data ? `/place?trip=${place.data.trip_id}` : '/place'}
              emptyMessage="아직 넣은 장소가 없어요."
              errorMessage="최근 장소를 불러오지 못했어요."
              onRetry={reloadPlace}
              renderCard={(data) => (
                <>
                  <span className={styles.cardTitle}>{data.name}</span>
                  <span className={styles.cardSub}>{data.region}</span>
                  <span className={styles.cardDate}>{data.visit_date}</span>
                </>
              )}
            />
            <RecentBlock
              label="최근 일기"
              tone="diary"
              state={diary}
              to={diary.data ? `/diary?trip=${diary.data.trip_id}` : '/diary'}
              // 다이어리 화면에서 이 일기를 펼친 채로 보인다 (2026-10-23 팀 합의)
              linkState={diary.data ? { openDiaryId: diary.data.id } : undefined}
              emptyMessage="아직 쓴 일기가 없어요."
              errorMessage="최근 일기를 불러오지 못했어요."
              onRetry={reloadDiary}
              renderCard={(data) => (
                <>
                  {/* 긴 제목은 한 줄로 줄이고 끝에 "…"를 붙인다 (SCREEN-SPEC 6절 2번) */}
                  <span className={`${styles.cardTitle} ${styles.oneLine}`}>
                    <span className={styles.mood} role="img" aria-label={data.mood}>
                      {MOOD_EMOJI[data.mood]}
                    </span>{' '}
                    {data.title}
                  </span>
                  <span className={styles.cardDate}>{data.date}</span>
                </>
              )}
            />
          </div>
        </section>
      )}
    </div>
  )
}
