import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPlace, updatePlace } from '../../api/places.js'
import { getTrip } from '../../api/trips.js'
import { useAuth } from '../../components/Auth/AuthContext.jsx'
import NotOwnerMessage from '../../components/Auth/NotOwnerMessage.jsx'
import { isTripOwner } from '../../components/Auth/ownership.js'
import Button from '../../components/Button/Button.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import PlaceForm from './PlaceForm.jsx'
import styles from './Places.module.css'

// 장소 수정 (담당: 은희). SCREEN-SPEC 4절. 주소: /place/:id/edit
// App.jsx에서 RequireLogin으로 감싼다. 남의 여행의 장소면 폼 대신 안내 (SCREEN-SPEC 1절, D-042).
export default function PlaceEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [place, setPlace] = useState(null)
  const [trip, setTrip] = useState(null)
  const [status, setStatus] = useState('loading')
  const { user } = useAuth()

  const loadPlace = useCallback(async () => {
    setStatus('loading')
    try {
      const loaded = await getPlace(id)
      // 폼에 보일 여행 이름·기간은 장소의 trip_id로 얻는다 (API-SPEC 3절 4번).
      const loadedTrip = await getTrip(loaded.trip_id)
      setPlace(loaded)
      setTrip(loadedTrip)
      setStatus('done')
    } catch (error) {
      setStatus(error.status === 404 ? 'notFound' : 'error')
    }
  }, [id])

  useEffect(() => {
    loadPlace()
  }, [loadPlace])

  const backToList = () => navigate(`/place?trip=${place.trip_id}`)

  async function handleSubmit(values) {
    await updatePlace(id, values)
    backToList()
  }

  if (status === 'done' && !isTripOwner(user, trip.user_id)) {
    return (
      <section className={styles.formPage}>
        <h1>장소 수정</h1>
        <NotOwnerMessage to={`/place?trip=${place.trip_id}`} />
      </section>
    )
  }

  if (status === 'done') {
    return (
      <section className={styles.formPage}>
        <PlaceForm
          title="장소 수정"
          trip={trip}
          initialValues={place}
          onSubmit={handleSubmit}
          onCancel={backToList}
        />
      </section>
    )
  }

  return (
    <section className={styles.formPage}>
      <h1>장소 수정</h1>
      {status === 'loading' && <StatusMessage kind="loading" />}
      {status === 'error' && (
        <StatusMessage kind="error" message="장소를 불러오지 못했어요." onRetry={loadPlace} />
      )}
      {status === 'notFound' && (
        <>
          <StatusMessage kind="error" message="찾을 수 없는 장소예요." />
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
