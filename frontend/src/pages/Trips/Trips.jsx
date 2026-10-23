import { useCallback, useEffect, useState } from 'react'
import { getTrips } from '../../api/trips.js'
import { useAuth } from '../../components/Auth/AuthContext.jsx'
import { loginUrl } from '../../components/Auth/loginPaths.js'
import Button from '../../components/Button/Button.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import TripCard from './TripCard.jsx'
import styles from './Trips.module.css'

// 여행 목록 (담당: 서준). SCREEN-SPEC 3절.
export default function Trips() {
  const [trips, setTrips] = useState([])
  const [status, setStatus] = useState('loading')
  const { user, loading: authLoading } = useAuth()

  const loadTrips = useCallback(async () => {
    setStatus('loading')
    try {
      setTrips(await getTrips())
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    loadTrips()
  }, [loadTrips])

  let content
  if (status === 'loading') {
    content = <StatusMessage kind="loading" />
  } else if (status === 'error') {
    content = (
      <StatusMessage kind="error" message="여행 목록을 불러오지 못했어요." onRetry={loadTrips} />
    )
  } else if (trips.length === 0) {
    // "여행 추가"는 로그인했을 때만. 로그인하지 않았으면 로그인 안내를 보인다 (SCREEN-SPEC 3절 2번, D-042).
    let action = null
    if (user) {
      action = <Button to="/trip/new">여행 추가</Button>
    } else if (!authLoading) {
      action = (
        <>
          <p className={styles.loginHint}>로그인하면 여행을 기록할 수 있어요.</p>
          <Button to={loginUrl('/trip')}>로그인</Button>
        </>
      )
    }
    content = <StatusMessage kind="empty" message="아직 기록한 여행이 없어요." action={action} />
  } else {
    content = (
      <ul className={styles.list} data-stagger>
        {trips.map((trip, index) => (
          <li key={trip.id}>
            <TripCard trip={trip} index={index} />
          </li>
        ))}
      </ul>
    )
  }

  // "여행 추가"는 한 곳에만 둔다: 목록이 있으면 오른쪽 위, 없으면 빈 상태 문구 아래.
  const hasList = status === 'done' && trips.length > 0

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        {/* 섹션 이름표 + 화면 제목 (2026-10-23 팀 합의, DESIGN 6절 "화면 머리") */}
        <div className={styles.titleBox}>
          <p className={styles.kicker}>여행 책장</p>
          <h1>여행 기록</h1>
        </div>
        {hasList && user && <Button to="/trip/new">여행 추가</Button>}
      </div>
      {content}
    </section>
  )
}
