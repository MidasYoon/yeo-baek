import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { deleteDiary, getDiaries } from '../../api/diaries.js'
import Button from '../../components/Button/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import TripSelect from '../../components/TripSelect/TripSelect.jsx'
import DiaryList from './DiaryList.jsx'
import styles from './Diary.module.css'

// 여행 다이어리 목록 (담당: 건용). SCREEN-SPEC 5절. 주소: /diary, /diary?trip=:tripId
export default function Diary() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tripParam = searchParams.get('trip')
  const [trips, setTrips] = useState(null)
  const [diaries, setDiaries] = useState([])
  const [status, setStatus] = useState('idle')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteFailed, setDeleteFailed] = useState(false)

  // 주소의 여행 번호가 여행 목록에 있을 때만 고른 것으로 본다 (없는 번호면 빈 select).
  const selectedTrip = trips?.find((trip) => String(trip.id) === tripParam) ?? null
  const selectedId = selectedTrip?.id ?? null

  const loadDiaries = useCallback(async (tripId, isCurrent = () => true) => {
    setStatus('loading')
    try {
      const loaded = await getDiaries(tripId)
      if (!isCurrent()) return
      setDiaries(loaded)
      setStatus('done')
    } catch {
      if (isCurrent()) setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (selectedId === null) {
      setStatus('idle')
      return
    }
    // 여행을 빠르게 바꿨을 때 앞서 부른 응답이 늦게 와도 덮어쓰지 않게 한다.
    let current = true
    loadDiaries(selectedId, () => current)
    return () => {
      current = false
    }
  }, [selectedId, loadDiaries])

  function handleTripChange(trip) {
    if (trip) setSearchParams({ trip: String(trip.id) })
  }

  function openDelete(diary) {
    setDeleteFailed(false)
    setDeleteTarget(diary)
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteFailed(false)
    try {
      await deleteDiary(deleteTarget.id)
      // 그 줄만 사라지고 고른 여행은 그대로다 (SCREEN-SPEC 5절 3번).
      setDiaries((prev) => prev.filter((diary) => diary.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
      // 지우지 못하면 일기는 그대로 둔다 (SCREEN-SPEC 5절 5번).
      setDeleteFailed(true)
    }
    setDeleting(false)
  }

  const newDiaryLink = selectedTrip ? `/diary/new?trip=${selectedTrip.id}` : null

  function renderActions(diary) {
    return (
      <>
        <Button variant="secondary" to={`/diary/${diary.id}/edit`}>
          수정
        </Button>
        <Button variant="secondary" onClick={() => openDelete(diary)}>
          삭제
        </Button>
      </>
    )
  }

  let content = null
  if (status === 'loading') {
    content = <StatusMessage kind="loading" />
  } else if (status === 'error') {
    content = (
      <StatusMessage
        kind="error"
        message="일기를 불러오지 못했어요."
        onRetry={() => loadDiaries(selectedId)}
      />
    )
  } else if (status === 'done' && diaries.length === 0) {
    content = (
      <StatusMessage
        kind="empty"
        message="아직 쓴 일기가 없어요."
        action={<Button to={newDiaryLink}>새 일기 쓰기</Button>}
      />
    )
  } else if (status === 'done') {
    // 여행을 바꾸면 펼친 줄이 모두 접히도록 여행마다 새로 그린다.
    content = <DiaryList key={selectedId} diaries={diaries} renderActions={renderActions} />
  }

  // "새 일기 쓰기"는 한 곳에만 둔다: 일기가 있으면 오른쪽 위, 없으면 빈 상태 문구 아래.
  const hasList = status === 'done' && diaries.length > 0

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1>여행 다이어리</h1>
        {hasList && <Button to={newDiaryLink}>새 일기 쓰기</Button>}
      </div>
      <TripSelect value={selectedId} onChange={handleTripChange} onLoad={setTrips} />
      {content}
      <ConfirmDialog
        open={deleteTarget !== null}
        busy={deleting}
        error={deleteFailed}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </section>
  )
}
