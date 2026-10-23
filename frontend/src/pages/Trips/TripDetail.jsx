import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDiaries } from '../../api/diaries.js'
import { getPlaces } from '../../api/places.js'
import { deleteTrip, getTrip, photoUrl } from '../../api/trips.js'
import Button from '../../components/Button/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import DiaryList from '../Diary/DiaryList.jsx'
import PlaceCard from '../Places/PlaceCard.jsx'
import { countText } from './countMessage.js'
import styles from './TripDetail.module.css'
import pageStyles from './Trips.module.css'

// 여행 상세 (담당: 서준). SCREEN-SPEC 3절. 주소: /trip/:id
// 아래에 그 여행의 장소·일기 목록을 보인다 (R-T-009). 장소 화면·다이어리 화면과 같은 모양·순서이고,
// 수정·삭제 버튼은 넘기지 않는다. 두 목록은 따로 불러와 하나가 실패해도 여행 내용은 그대로 보인다.
export default function TripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [status, setStatus] = useState('loading')
  const [places, setPlaces] = useState([])
  const [placesStatus, setPlacesStatus] = useState('loading')
  const [diaries, setDiaries] = useState([])
  const [diariesStatus, setDiariesStatus] = useState('loading')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteFailed, setDeleteFailed] = useState(false)
  const [blocked, setBlocked] = useState(null)
  // 불러오지 못한 사진 이름. 그 사진은 없는 것처럼 숨긴다 (SCREEN-SPEC 1절 "사진 표시").
  const [brokenPhoto, setBrokenPhoto] = useState(null)

  const loadTrip = useCallback(async () => {
    setStatus('loading')
    try {
      setTrip(await getTrip(id))
      setStatus('done')
    } catch (error) {
      setStatus(error.status === 404 ? 'notFound' : 'error')
    }
  }, [id])

  const loadPlaces = useCallback(async (isCurrent = () => true) => {
    setPlacesStatus('loading')
    try {
      const loaded = await getPlaces(id)
      if (!isCurrent()) return
      setPlaces(loaded)
      setPlacesStatus('done')
    } catch {
      if (isCurrent()) setPlacesStatus('error')
    }
  }, [id])

  const loadDiaries = useCallback(async (isCurrent = () => true) => {
    setDiariesStatus('loading')
    try {
      const loaded = await getDiaries(id)
      if (!isCurrent()) return
      setDiaries(loaded)
      setDiariesStatus('done')
    } catch {
      if (isCurrent()) setDiariesStatus('error')
    }
  }, [id])

  useEffect(() => {
    loadTrip()
  }, [loadTrip])

  useEffect(() => {
    // 다른 여행으로 옮겨 간 뒤 앞서 부른 응답이 늦게 와도 덮어쓰지 않게 한다.
    let current = true
    loadPlaces(() => current)
    loadDiaries(() => current)
    return () => {
      current = false
    }
  }, [loadPlaces, loadDiaries])

  function openDialog() {
    setBlocked(null)
    setDeleteFailed(false)
    // 두 목록을 모두 불러왔으면 그 개수로 확인 창 대신 안내를 먼저 보인다 (SCREEN-SPEC 3절 4번, D-019).
    // 하나라도 불러오지 못했으면 확인 창을 띄우고 서버의 409로 안내한다.
    if (placesStatus === 'done' && diariesStatus === 'done') {
      const counts = { place_count: places.length, diary_count: diaries.length }
      if (counts.place_count > 0 || counts.diary_count > 0) {
        setBlocked(counts)
        return
      }
    }
    setDialogOpen(true)
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteFailed(false)
    try {
      await deleteTrip(id)
      navigate('/trip', { replace: true })
    } catch (error) {
      setDeleting(false)
      if (error.status === 409 && error.detail) {
        // 장소·일기가 붙은 여행은 지울 수 없다 (R-T-012, D-015).
        setDialogOpen(false)
        setBlocked(error.detail)
      } else {
        setDeleteFailed(true)
      }
    }
  }

  if (status === 'loading') {
    return (
      <section className={pageStyles.page}>
        <StatusMessage kind="loading" />
      </section>
    )
  }

  if (status === 'notFound') {
    return (
      <section className={pageStyles.page}>
        <StatusMessage kind="error" message="찾을 수 없는 여행이에요." />
        <div className={styles.center}>
          <Button variant="secondary" to="/trip">
            목록으로
          </Button>
        </div>
      </section>
    )
  }

  if (status === 'error') {
    return (
      <section className={pageStyles.page}>
        <StatusMessage kind="error" message="여행을 불러오지 못했어요." onRetry={loadTrip} />
      </section>
    )
  }

  return (
    <section className={pageStyles.page}>
      <div className={styles.head}>
        {trip.photo && trip.photo !== brokenPhoto && (
          <img
            className={styles.photo}
            src={photoUrl(trip.photo)}
            alt="여행 대표사진"
            onError={() => setBrokenPhoto(trip.photo)}
          />
        )}
        <h1 className={styles.title}>{trip.name}</h1>
        <p className={styles.meta}>
          <span className={styles.destination}>{trip.destination}</span> · {trip.start_date} ~ {trip.end_date}
        </p>
        {trip.info && <p className={styles.info}>{trip.info}</p>}
      </div>

      {blocked && (
        <p className={styles.blocked} role="alert">
          {countText(blocked)}이 있어 지울 수 없어요. 먼저 지워 주세요.
        </p>
      )}

      <div className={styles.actions}>
        <Button variant="secondary" to="/trip">
          목록으로
        </Button>
        <Button variant="secondary" to={`/trip/${trip.id}/edit`}>
          수정
        </Button>
        <Button variant="secondary" onClick={openDialog}>
          삭제
        </Button>
      </div>

      <section className={styles.part}>
        {/* 장(章) 제목: 이름 + 개수 + 오른쪽으로 이어지는 선 (여행 책장, 2026-10-23 팀 합의) */}
        <h2 className={styles.partTitle}>
          장소
          {placesStatus === 'done' && <span className={styles.count}>{places.length}곳</span>}
          <span className={styles.rule} aria-hidden="true" />
        </h2>
        {placesStatus === 'loading' && <StatusMessage kind="loading" />}
        {placesStatus === 'error' && (
          <StatusMessage
            kind="error"
            message="장소를 불러오지 못했어요."
            onRetry={() => loadPlaces()}
          />
        )}
        {placesStatus === 'done' && places.length === 0 && (
          <StatusMessage kind="empty" message="아직 넣은 장소가 없어요." />
        )}
        {placesStatus === 'done' && places.length > 0 && (
          <ul className={styles.placeList} data-stagger>
            {places.map((place) => (
              <li key={place.id}>
                <PlaceCard place={place} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.part}>
        <h2 className={styles.partTitle}>
          일기
          {diariesStatus === 'done' && <span className={styles.count}>{diaries.length}편</span>}
          <span className={styles.rule} aria-hidden="true" />
        </h2>
        {diariesStatus === 'loading' && <StatusMessage kind="loading" />}
        {diariesStatus === 'error' && (
          <StatusMessage
            kind="error"
            message="일기를 불러오지 못했어요."
            onRetry={() => loadDiaries()}
          />
        )}
        {diariesStatus === 'done' && diaries.length === 0 && (
          <StatusMessage kind="empty" message="아직 쓴 일기가 없어요." />
        )}
        {diariesStatus === 'done' && diaries.length > 0 && (
          <DiaryList key={id} diaries={diaries} />
        )}
      </section>

      <ConfirmDialog
        open={dialogOpen}
        busy={deleting}
        error={deleteFailed}
        onCancel={() => setDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </section>
  )
}
