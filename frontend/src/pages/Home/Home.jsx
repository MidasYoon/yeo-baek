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
          <p className={styles.eyebrow}>여백 · 여행 다이어리</p>
          <h1 className={styles.headline}>처마 끝에 걸린 오늘의 여행을 적어 두세요</h1>
          <p className={styles.intro}>
            다녀온 곳은 지도에, 그날의 마음은 일기에. 여행 한 편을 차곡차곡 남겨 보세요.
          </p>
          <div className={styles.heroAction}>
            <Button to="/trip/new">새 여행 만들기</Button>
          </div>
          {firstVisit && <p className={styles.firstVisit}>첫 여행을 만들어 보세요</p>}
        </div>
        <img className={styles.heroImage} src={hanokImage} alt="" aria-hidden="true" />
      </section>

      {!firstVisit && (
        <section className={styles.recent} aria-labelledby="recent-title">
          <h2 id="recent-title" className={styles.sectionTitle}>
            최근 기록
            <svg className={styles.eave} viewBox="0 0 48 12" aria-hidden="true">
              <path d="M2 10Q8 4 24 4T46 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </h2>
          <div className={styles.blocks}>
            <RecentBlock
              label="최근 여행"
              state={trip}
              to={trip.data ? `/trip/${trip.data.id}` : '/trip'}
              emptyMessage="아직 기록한 여행이 없어요."
              errorMessage="최근 여행을 불러오지 못했어요."
              onRetry={reloadTrip}
              renderCard={(data) => (
                <>
                  <span className={styles.cardTitle}>{data.name}</span>
                  <span className={styles.cardMeta}>
                    {data.destination} · {data.start_date} ~ {data.end_date}
                  </span>
                </>
              )}
            />
            <RecentBlock
              label="최근 장소"
              state={place}
              to="/place"
              emptyMessage="아직 넣은 장소가 없어요."
              errorMessage="최근 장소를 불러오지 못했어요."
              onRetry={reloadPlace}
              renderCard={(data) => (
                <>
                  <span className={styles.cardTitle}>{data.name}</span>
                  <span className={styles.cardMeta}>
                    {data.region} · {data.visit_date}
                  </span>
                </>
              )}
            />
            <RecentBlock
              label="최근 일기"
              state={diary}
              to="/diary"
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
                  <span className={styles.cardMeta}>{data.date}</span>
                </>
              )}
            />
          </div>
        </section>
      )}
    </div>
  )
}
