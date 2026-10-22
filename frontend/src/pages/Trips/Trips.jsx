import { useCallback, useEffect, useState } from 'react'
import { getTrips } from '../../api/trips.js'
import Button from '../../components/Button/Button.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import TripCard from './TripCard.jsx'
import styles from './Trips.module.css'

// 여행 목록 (담당: 서준). SCREEN-SPEC 3절.
export default function Trips() {
  const [trips, setTrips] = useState([])
  const [status, setStatus] = useState('loading')

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
    content = (
      <StatusMessage
        kind="empty"
        message="아직 기록한 여행이 없어요."
        action={<Button to="/trip/new">새 여행 만들기</Button>}
      />
    )
  } else {
    content = (
      <ul className={styles.list}>
        {trips.map((trip, index) => (
          <li key={trip.id}>
            <TripCard trip={trip} index={index} />
          </li>
        ))}
      </ul>
    )
  }

  // "새 여행 만들기"는 한 곳에만 둔다: 목록이 있으면 오른쪽 위, 없으면 빈 상태 문구 아래.
  const hasList = status === 'done' && trips.length > 0

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>여행기록</h1>
        {hasList && <Button to="/trip/new">새 여행 만들기</Button>}
      </div>
      {content}
    </section>
  )
}
