import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createDiary } from '../../api/diaries.js'
import { getTrip } from '../../api/trips.js'
import Button from '../../components/Button/Button.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import DiaryForm from './DiaryForm.jsx'
import styles from './Diary.module.css'

// 일기 쓰기 (담당: 건용). SCREEN-SPEC 5절. 주소: /diary/new?trip=:tripId
export default function DiaryNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tripParam = searchParams.get('trip')
  const [trip, setTrip] = useState(null)
  const [status, setStatus] = useState('loading')

  const loadTrip = useCallback(async () => {
    // 여행 번호가 없으면 없는 여행과 같게 보인다 (TEST-PLAN T-D-40).
    if (!tripParam) {
      setStatus('notFound')
      return
    }
    setStatus('loading')
    try {
      setTrip(await getTrip(tripParam))
      setStatus('done')
    } catch (error) {
      setStatus(error.status === 404 ? 'notFound' : 'error')
    }
  }, [tripParam])

  useEffect(() => {
    loadTrip()
  }, [loadTrip])

  const backToList = () => navigate(`/diary?trip=${trip.id}`)

  async function handleSubmit(values) {
    await createDiary({ ...values, trip_id: trip.id })
    backToList()
  }

  if (status === 'done') {
    return (
      <section className={styles.page}>
        <DiaryForm title="일기 추가" trip={trip} onSubmit={handleSubmit} onCancel={backToList} />
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <h1>일기 추가</h1>
      {status === 'loading' && <StatusMessage kind="loading" />}
      {status === 'error' && (
        <StatusMessage kind="error" message="여행을 불러오지 못했어요." onRetry={loadTrip} />
      )}
      {status === 'notFound' && (
        <>
          <StatusMessage kind="error" message="찾을 수 없는 여행이에요." />
          <div className={styles.center}>
            <Button variant="secondary" to="/diary">
              목록으로
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
