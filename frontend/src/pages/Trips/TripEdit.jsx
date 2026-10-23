import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTrip, updateTrip } from '../../api/trips.js'
import Button from '../../components/Button/Button.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import TripForm from './TripForm.jsx'
import detailStyles from './TripDetail.module.css'
import styles from './Trips.module.css'

// 여행 수정 (담당: 서준). SCREEN-SPEC 3절. 주소: /trip/:id/edit
export default function TripEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [status, setStatus] = useState('loading')

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

  async function handleSubmit(values) {
    await updateTrip(id, values)
    // 저장되면 상세로 돌아간다.
    navigate(`/trip/${id}`, { replace: true })
  }

  function handleCancel() {
    // 이전 화면으로. 주소를 바로 열어 이전 화면이 없으면 그 여행의 상세로 간다.
    if (window.history.state?.idx > 0) {
      navigate(-1)
    } else {
      navigate(`/trip/${id}`)
    }
  }

  let content
  if (status === 'loading') {
    content = <StatusMessage kind="loading" />
  } else if (status === 'notFound') {
    content = (
      <>
        <StatusMessage kind="error" message="찾을 수 없는 여행이에요." />
        <div className={detailStyles.center}>
          <Button variant="secondary" to="/trip">
            목록으로
          </Button>
        </div>
      </>
    )
  } else if (status === 'error') {
    content = <StatusMessage kind="error" message="여행을 불러오지 못했어요." onRetry={loadTrip} />
  } else {
    content = <TripForm initialValues={trip} onSubmit={handleSubmit} onCancel={handleCancel} />
  }

  return (
    <section className={styles.formPage}>
      <h1>여행 수정</h1>
      {content}
    </section>
  )
}
