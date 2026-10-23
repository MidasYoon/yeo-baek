import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createPlace } from '../../api/places.js'
import { getTrip } from '../../api/trips.js'
import Button from '../../components/Button/Button.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import PlaceForm from './PlaceForm.jsx'
import styles from './Places.module.css'

// 장소 추가 (담당: 은희). SCREEN-SPEC 4절. 주소: /place/new?trip=:tripId
export default function PlaceNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tripParam = searchParams.get('trip')
  const [trip, setTrip] = useState(null)
  const [status, setStatus] = useState('loading')

  const loadTrip = useCallback(async () => {
    // 여행 번호가 없으면 없는 여행과 같게 보인다 (TEST-PLAN T-P-44).
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

  const backToList = () => navigate(`/place?trip=${trip.id}`)

  async function handleSubmit(values) {
    await createPlace({ ...values, trip_id: trip.id })
    backToList()
  }

  if (status === 'done') {
    return (
      <section className={styles.formPage}>
        <PlaceForm title="장소 추가" trip={trip} onSubmit={handleSubmit} onCancel={backToList} />
      </section>
    )
  }

  return (
    <section className={styles.formPage}>
      <h1>장소 추가</h1>
      {status === 'loading' && <StatusMessage kind="loading" />}
      {status === 'error' && (
        <StatusMessage kind="error" message="여행을 불러오지 못했어요." onRetry={loadTrip} />
      )}
      {status === 'notFound' && (
        <>
          <StatusMessage kind="error" message="찾을 수 없는 여행이에요." />
          <div className={styles.center}>
            <Button variant="secondary" to="/place">
              목록으로
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
