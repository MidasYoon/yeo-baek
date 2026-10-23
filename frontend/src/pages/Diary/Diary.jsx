import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { deleteDiary, getDiaries, getDiaryPage } from '../../api/diaries.js'
import { useAuth } from '../../components/Auth/AuthContext.jsx'
import AuthErrorText from '../../components/Auth/AuthErrorText.jsx'
import { isTripOwner } from '../../components/Auth/ownership.js'
import Button from '../../components/Button/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx'
import Pagination from '../../components/Pagination/Pagination.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import TripSelect from '../../components/TripSelect/TripSelect.jsx'
import DiaryList from './DiaryList.jsx'
import styles from './Diary.module.css'

// 여행 다이어리 목록 (담당: 건용). SCREEN-SPEC 5절. 주소: /diary, /diary?page=:page, /diary?trip=:tripId
// 여행 번호가 없으면 "전체 여행"으로 모든 여행의 일기를 최신순으로 20편씩 페이지로 나눠 보인다 (D-034).
const PAGE_SIZE = 20 // 서버의 기본값과 같다 (API-SPEC 4절 4번)

// ?page=가 숫자가 아니거나 1보다 작으면 1페이지 (SCREEN-SPEC 1절 "잘못된 페이지 번호")
function readPage(value) {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

export default function Diary() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tripParam = searchParams.get('trip')
  const page = readPage(searchParams.get('page'))
  const location = useLocation()
  const navigate = useNavigate()
  // Home 최근 일기(C) 카드로 오면 그 일기를 펼친 채로 보인다. 새로고침·여행 바꾸기·네비 메뉴로 오면 없다 (2026-10-23 팀 합의).
  const [openDiaryId, setOpenDiaryId] = useState(() => location.state?.openDiaryId ?? null)
  const [trips, setTrips] = useState(null)
  const [diaries, setDiaries] = useState([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('idle')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  // 지우기에 실패한 Error (401·403이면 그 문구, 그 밖은 공통 문구, D-042)
  const [deleteError, setDeleteError] = useState(null)
  const { user } = useAuth()

  // 주소의 여행 번호가 여행 목록에 있을 때만 고른 것으로 본다. 아니면 전체 보기 (D-034).
  const selectedTrip = trips?.find((trip) => String(trip.id) === tripParam) ?? null
  const selectedId = selectedTrip?.id ?? null
  // 여행 목록을 불러와 여행이 하나라도 있어야 일기를 부른다.
  const showAll = trips?.length > 0 && selectedId === null
  // 내 여행의 번호들. "일기 추가"와 줄의 수정·삭제는 내 여행에만 보인다 (SCREEN-SPEC 1절, D-042).
  // 전체 보기에서는 일기마다 그 일기의 여행으로 본다.
  const ownTripIds = new Set(
    (trips ?? []).filter((trip) => isTripOwner(user, trip.user_id)).map((trip) => trip.id),
  )
  // 여행 번호 → 그 여행 주인의 닉네임. 일기의 작성자로 보인다 (D-046). 주인 없는 여행은 null
  const writerByTrip = new Map((trips ?? []).map((trip) => [trip.id, trip.user_nickname]))

  const loadDiaries = useCallback(
    async (tripId, pageNumber, isCurrent = () => true) => {
      setStatus('loading')
      try {
        if (tripId !== null) {
          const loaded = await getDiaries(tripId)
          if (!isCurrent()) return
          // API는 오래된 순이다. 이 화면은 전체 보기와 같이 최신순으로 뒤집어 보인다.
          // 여행 상세는 API 순서 그대로다 (2026-10-23 사람이 정함, D-034).
          setDiaries([...loaded].reverse())
        } else {
          const { items, total: count } = await getDiaryPage(pageNumber)
          if (!isCurrent()) return
          // 마지막 페이지보다 큰 번호면 마지막 페이지로 바꾼다. 지운 뒤 페이지가 비었을 때도 같다.
          const lastPage = Math.max(1, Math.ceil(count / PAGE_SIZE))
          if (pageNumber > lastPage) {
            setSearchParams({ page: String(lastPage) }, { replace: true })
            return
          }
          setDiaries(items)
          setTotal(count)
        }
        setStatus('done')
      } catch {
        if (isCurrent()) setStatus('error')
      }
    },
    [setSearchParams],
  )

  // 넘겨받은 값은 한 번만 쓴다. 브라우저 기록에서 지워 새로고침하면 접힌 채로 보이게 한다.
  useEffect(() => {
    if (location.state?.openDiaryId != null) {
      navigate({ search: location.search }, { replace: true, state: null })
    }
  }, [location, navigate])

  useEffect(() => {
    if (selectedId === null && !showAll) {
      setStatus('idle')
      return
    }
    // 여행·페이지를 빠르게 바꿨을 때 앞서 부른 응답이 늦게 와도 덮어쓰지 않게 한다.
    let current = true
    loadDiaries(selectedId, page, () => current)
    return () => {
      current = false
    }
  }, [selectedId, showAll, page, loadDiaries])

  function handleTripChange(trip) {
    setOpenDiaryId(null)
    // "전체 여행"을 고르면 trip이 null이다. 전체 보기 1페이지(/diary)로 간다.
    setSearchParams(trip ? { trip: String(trip.id) } : {})
  }

  function handlePageChange(nextPage) {
    setSearchParams({ page: String(nextPage) })
    window.scrollTo({ top: 0 })
  }

  function openDelete(diary) {
    setDeleteError(null)
    setDeleteTarget(diary)
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteDiary(deleteTarget.id)
      setDeleteTarget(null)
      if (showAll) {
        // 전체 보기는 지금 페이지를 다시 불러와 다음 페이지의 일기로 채운다 (SCREEN-SPEC 5절 3번).
        await loadDiaries(null, page)
      } else {
        // 그 줄만 사라지고 고른 여행은 그대로다 (SCREEN-SPEC 5절 3번).
        setDiaries((prev) => prev.filter((diary) => diary.id !== deleteTarget.id))
      }
    } catch (error) {
      // 지우지 못하면 일기는 그대로 둔다 (SCREEN-SPEC 5절 5번).
      setDeleteError(error)
    }
    setDeleting(false)
  }

  const newDiaryLink =
    selectedTrip && ownTripIds.has(selectedTrip.id) ? `/diary/new?trip=${selectedTrip.id}` : null

  function renderActions(diary) {
    if (!ownTripIds.has(diary.trip_id)) return null
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
        onRetry={() => loadDiaries(selectedId, page)}
      />
    )
  } else if (status === 'done' && diaries.length === 0) {
    // 전체 보기에서는 쓸 여행이 정해지지 않아 "일기 추가" 버튼을 두지 않는다 (SCREEN-SPEC 5절 5번).
    content = (
      <StatusMessage
        kind="empty"
        message="아직 쓴 일기가 없어요."
        action={newDiaryLink && <Button to={newDiaryLink}>일기 추가</Button>}
      />
    )
  } else if (status === 'done') {
    // 여행이나 페이지를 바꾸면 펼친 줄이 모두 접히도록 새로 그린다.
    content = (
      <div>
        <DiaryList
          key={showAll ? `page-${page}` : selectedId}
          diaries={diaries}
          renderActions={renderActions}
          initialOpenId={openDiaryId}
          // 작성자는 전체 보기의 줄에만. 여행을 고르면 select 아래에 한 번 보인다 (D-046)
          writerOf={showAll ? (diary) => writerByTrip.get(diary.trip_id) ?? null : undefined}
        />
        {showAll && (
          <Pagination
            page={page}
            totalPages={Math.ceil(total / PAGE_SIZE)}
            onChange={handlePageChange}
          />
        )}
      </div>
    )
  }

  // "일기 추가"는 한 곳에만 둔다: 일기가 있으면 오른쪽 위, 없으면 빈 상태 문구 아래. 전체 보기에는 없다.
  const hasList = status === 'done' && diaries.length > 0

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        {/* 섹션 이름표 + 화면 제목 (2026-10-23 팀 합의, DESIGN 6절 "화면 머리") */}
        <div className={styles.titleBox}>
          <p className={styles.kicker}>여행 일기장</p>
          <h1>여행 일기</h1>
        </div>
        {hasList && newDiaryLink && <Button to={newDiaryLink}>일기 추가</Button>}
      </div>
      <div className={styles.tripField}>
        <TripSelect value={selectedId} onChange={handleTripChange} onLoad={setTrips} />
        {/* 전체 보기에서는 "일기 추가" 대신 안내를 둔다 (SCREEN-SPEC 5절 2번, AI 제안 문구) */}
        {showAll && user && <p className={styles.guide}>여행을 고르면 일기를 쓸 수 있어요.</p>}
        {/* 고른 여행의 작성자를 한 번 보인다. 주인 없는 여행이면 없다 (D-046, SCREEN-SPEC 5절 2번) */}
        {selectedTrip?.user_nickname && (
          <p className={styles.guide}>기록한 사람 {selectedTrip.user_nickname}</p>
        )}
      </div>
      {content}
      <ConfirmDialog
        open={deleteTarget !== null}
        busy={deleting}
        error={
          deleteError && (
            <AuthErrorText error={deleteError} fallback="지우지 못했어요. 다시 시도해 주세요." />
          )
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </section>
  )
}
