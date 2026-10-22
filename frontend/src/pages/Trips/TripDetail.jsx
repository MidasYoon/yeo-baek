import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteTrip, getTrip } from '../../api/trips.js'
import Button from '../../components/Button/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import { countText } from './countMessage.js'
import styles from './TripDetail.module.css'
import pageStyles from './Trips.module.css'

// 여행 상세 (담당: 서준). SCREEN-SPEC 3절. 주소: /trip/:id
// 상세 안의 장소·일기 목록(R-T-009)은 P-34에서 붙인다.
export default function TripDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [status, setStatus] = useState('loading')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteFailed, setDeleteFailed] = useState(false)
  const [blocked, setBlocked] = useState(null)

  const loadTrip = useCallback(async () => {
    setStatus('loading')
    try {
      setTrip(await getTrip(id))
      setStatus('done')
    } catch (error) {
      setStatus(error.status === 404 ? 'notFound' : 'error')
    }
  }, [id])

  useEffect(() => {
    loadTrip()
  }, [loadTrip])

  function openDialog() {
    setBlocked(null)
    setDeleteFailed(false)
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
        <h1 className={styles.title}>{trip.name}</h1>
        <p className={styles.meta}>
          {trip.destination} · {trip.start_date} ~ {trip.end_date}
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
