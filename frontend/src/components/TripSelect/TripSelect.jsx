import { useCallback, useEffect, useState } from 'react'
import { getTrips } from '../../api/trips.js'
import Button from '../Button/Button.jsx'
import StatusMessage from '../StatusMessage/StatusMessage.jsx'
import styles from './TripSelect.module.css'

// 여행 select (팀 공동, D-028). SCREEN-SPEC 1절, DESIGN 6절 "여행 select".
// value: 고른 여행 번호 (없으면 빈 select). 목록에 없는 번호여도 빈 select로 보인다.
// onChange(trip): 여행을 고르면 그 여행 객체를 넘긴다. 주소(?trip=)는 화면이 바꾼다.
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
        action={<Button to="/trip/new">새 여행 만들기</Button>}
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
        <option value="" disabled>
          여행을 골라 주세요
        </option>
        {trips.map((trip) => (
          <option key={trip.id} value={trip.id}>
            {trip.name} ({trip.start_date} ~ {trip.end_date})
          </option>
        ))}
      </select>
    </label>
  )
}
