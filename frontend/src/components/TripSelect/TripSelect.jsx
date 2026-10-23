import { useCallback, useEffect, useState } from 'react'
import { getTrips } from '../../api/trips.js'
import Button from '../Button/Button.jsx'
import StatusMessage from '../StatusMessage/StatusMessage.jsx'
import styles from './TripSelect.module.css'

// 여행 select (팀 공동, D-028). SCREEN-SPEC 1절, DESIGN 6절 "여행 select".
// value: 고른 여행 번호. 없거나 목록에 없는 번호면 맨 위 "전체 여행"이 골라진 채로 보인다 (D-034).
// onChange(trip): 여행을 고르면 그 여행 객체를, "전체 여행"을 고르면 null을 넘긴다. 주소(?trip=)는 화면이 바꾼다.
// onLoad(trips): (선택) 여행 목록을 불러오면 넘긴다. 화면이 주소의 번호가 있는 여행인지 볼 때 쓴다.
export default function TripSelect({ value, onChange, onLoad }) {
  const [trips, setTrips] = useState([])
  const [status, setStatus] = useState('loading')

  const loadTrips = useCallback(async () => {
    setStatus('loading')
    try {
      const loaded = await getTrips()
      setTrips(loaded)
      setStatus('done')
      onLoad?.(loaded)
    } catch {
      setStatus('error')
    }
    // onLoad가 바뀔 때마다 다시 불러오지 않도록 처음 한 번만 만든다.
  }, [])

  useEffect(() => {
    loadTrips()
  }, [loadTrips])

  if (status === 'loading') {
    return <StatusMessage kind="loading" />
  }

  if (status === 'error') {
    return (
      <StatusMessage kind="error" message="여행 목록을 불러오지 못했어요." onRetry={loadTrips} />
    )
  }

  if (trips.length === 0) {
    return (
      <StatusMessage
        kind="empty"
        message="아직 기록한 여행이 없어요."
        action={<Button to="/trip/new">여행 추가</Button>}
      />
    )
  }

  const selected = trips.some((trip) => String(trip.id) === String(value)) ? String(value) : ''

  function handleChange(event) {
    const trip = trips.find((item) => String(item.id) === event.target.value)
    onChange(trip ?? null)
  }

  return (
    <label className={styles.field}>
      <span className={styles.label}>여행</span>
      <select className={styles.select} value={selected} onChange={handleChange}>
        <option value="">전체 여행</option>
        {trips.map((trip) => (
          <option key={trip.id} value={trip.id}>
            {trip.name} ({trip.start_date} ~ {trip.end_date})
          </option>
        ))}
      </select>
    </label>
  )
}
