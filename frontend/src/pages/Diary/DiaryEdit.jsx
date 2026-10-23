import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDiary, updateDiary } from '../../api/diaries.js'
import { getTrip } from '../../api/trips.js'
import Button from '../../components/Button/Button.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import DiaryForm from './DiaryForm.jsx'
import styles from './Diary.module.css'

// 일기 수정 (담당: 건용). SCREEN-SPEC 5절. 주소: /diary/:id/edit
export default function DiaryEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [diary, setDiary] = useState(null)
  const [trip, setTrip] = useState(null)
  const [status, setStatus] = useState('loading')

  const loadDiary = useCallback(async () => {
    setStatus('loading')
    try {
      const loaded = await getDiary(id)
      // 폼에 보일 여행 이름·기간은 일기의 trip_id로 얻는다 (API-SPEC 4절 4번).
      const loadedTrip = await getTrip(loaded.trip_id)
      setDiary(loaded)
      setTrip(loadedTrip)
      setStatus('done')
    } catch (error) {
      setStatus(error.status === 404 ? 'notFound' : 'error')
    }
  }, [id])

  useEffect(() => {
    loadDiary()
  }, [loadDiary])

  const backToList = () => navigate(`/diary?trip=${diary.trip_id}`)

  async function handleSubmit(values) {
    await updateDiary(id, values)
    backToList()
  }

  if (status === 'done') {
    return (
      <section className={styles.page}>
        <DiaryForm
          title="일기 수정"
          trip={trip}
          initialValues={diary}
          onSubmit={handleSubmit}
          onCancel={backToList}
        />
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <h1>일기 수정</h1>
      {status === 'loading' && <StatusMessage kind="loading" />}
      {status === 'error' && (
        <StatusMessage kind="error" message="일기를 불러오지 못했어요." onRetry={loadDiary} />
      )}
      {status === 'notFound' && (
        <>
          <StatusMessage kind="error" message="찾을 수 없는 일기예요." />
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
