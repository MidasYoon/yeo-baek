import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { deletePlace, getPlacePage, getPlaces, loadKakaoMaps } from '../../api/places.js'
import { useAuth } from '../../components/Auth/AuthContext.jsx'
import AuthErrorText from '../../components/Auth/AuthErrorText.jsx'
import { isTripOwner } from '../../components/Auth/ownership.js'
import Button from '../../components/Button/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx'
import Pagination from '../../components/Pagination/Pagination.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import TripSelect from '../../components/TripSelect/TripSelect.jsx'
import PlaceCard from './PlaceCard.jsx'
import PlaceMap, { pinKeyOf } from './PlaceMap.jsx'
import styles from './Places.module.css'

// 여행지 정보 목록 (담당: 은희). SCREEN-SPEC 4절. 주소: /place, /place?page=:page, /place?trip=:tripId
// 여행 번호가 없으면 "전체 여행"으로 모든 여행의 장소를 10곳씩 페이지로 나눠 보인다 (D-034).
const PAGE_SIZE = 10 // 서버의 기본값과 같다 (API-SPEC 3절 4번)

// ?page=가 숫자가 아니거나 1보다 작으면 1페이지 (SCREEN-SPEC 1절 "잘못된 페이지 번호")
function readPage(value) {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

export default function Places() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tripParam = searchParams.get('trip')
  const page = readPage(searchParams.get('page'))
  const [trips, setTrips] = useState(null)
  const [places, setPlaces] = useState([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('idle')
  // 눌린 핀의 키 (pinKeyOf). 카카오맵은 같은 곳, 그림 지도는 시·도로 묶는다 (D-036).
  const [selectedKey, setSelectedKey] = useState(null)
  // 지도 종류: 카카오맵을 불러오는 중 → 'kakao', 불러오지 못하면 그림 지도 'svg' (D-036).
  const [mapMode, setMapMode] = useState('loading')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  // 지우기에 실패한 Error (401·403이면 그 문구, 그 밖은 공통 문구, D-042)
  const [deleteError, setDeleteError] = useState(null)
  const listRef = useRef(null)
  const { user } = useAuth()

  // 주소의 여행 번호가 여행 목록에 있을 때만 고른 것으로 본다. 아니면 전체 보기 (D-034).
  const selectedTrip = trips?.find((trip) => String(trip.id) === tripParam) ?? null
  const selectedId = selectedTrip?.id ?? null
  // 여행 목록을 불러와 여행이 하나라도 있어야 장소를 부른다.
  const showAll = trips?.length > 0 && selectedId === null
  // 내 여행의 번호들. "장소 추가"와 카드의 수정·삭제는 내 여행에만 보인다 (SCREEN-SPEC 1절, D-042).
  // 전체 보기에서는 장소마다 그 장소의 여행으로 본다.
  const ownTripIds = new Set(
    (trips ?? []).filter((trip) => isTripOwner(user, trip.user_id)).map((trip) => trip.id),
  )

  const loadPlaces = useCallback(
    async (tripId, pageNumber, isCurrent = () => true) => {
      setStatus('loading')
      try {
        if (tripId !== null) {
          const loaded = await getPlaces(tripId)
          if (!isCurrent()) return
          // API는 오래된 순이다. 이 화면은 전체 보기와 같이 최신순으로 뒤집어 보인다.
          // 여행 상세는 API 순서 그대로다 (2026-10-23 사람이 정함, D-034).
          setPlaces([...loaded].reverse())
        } else {
          const { items, total: count } = await getPlacePage(pageNumber)
          if (!isCurrent()) return
          // 마지막 페이지보다 큰 번호면 마지막 페이지로 바꾼다. 지운 뒤 페이지가 비었을 때도 같다.
          const lastPage = Math.max(1, Math.ceil(count / PAGE_SIZE))
          if (pageNumber > lastPage) {
            setSearchParams({ page: String(lastPage) }, { replace: true })
            return
          }
          setPlaces(items)
          setTotal(count)
        }
        setStatus('done')
      } catch {
        if (isCurrent()) setStatus('error')
      }
    },
    [setSearchParams],
  )

  // 카카오맵 SDK는 화면에 들어올 때 한 번 불러온다.
  useEffect(() => {
    let current = true
    loadKakaoMaps()
      .then(() => current && setMapMode('kakao'))
      .catch(() => current && setMapMode('svg'))
    return () => {
      current = false
    }
  }, [])

  useEffect(() => {
    // 여행이나 페이지를 바꾸면 핀 강조는 풀린다 (SCREEN-SPEC 4절 3번).
    setSelectedKey(null)
    if (selectedId === null && !showAll) {
      setStatus('idle')
      return
    }
    // 여행·페이지를 빠르게 바꿨을 때 앞서 부른 응답이 늦게 와도 덮어쓰지 않게 한다.
    let current = true
    loadPlaces(selectedId, page, () => current)
    return () => {
      current = false
    }
  }, [selectedId, showAll, page, loadPlaces])

  // 핀을 누르면 강조된 카드 중 첫 카드가 화면에 보이도록 목록을 움직인다 (AI 제안).
  useEffect(() => {
    if (!selectedKey) return
    listRef.current
      ?.querySelector('[data-highlighted="true"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedKey])

  function handleTripChange(trip) {
    // "전체 여행"을 고르면 trip이 null이다. 전체 보기 1페이지(/place)로 간다.
    setSearchParams(trip ? { trip: String(trip.id) } : {})
  }

  function handlePageChange(nextPage) {
    setSearchParams({ page: String(nextPage) })
    window.scrollTo({ top: 0 })
  }

  function handlePinSelect(key) {
    // 같은 핀을 다시 누르면 강조가 풀린다.
    setSelectedKey((prev) => (prev === key ? null : key))
  }

  function openDelete(place) {
    setDeleteError(null)
    setDeleteTarget(place)
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deletePlace(deleteTarget.id)
      const remaining = places.filter((place) => place.id !== deleteTarget.id)
      setDeleteTarget(null)
      if (showAll) {
        // 전체 보기는 지금 페이지를 다시 불러와 다음 페이지의 장소로 채운다 (SCREEN-SPEC 4절 3번).
        await loadPlaces(null, page)
      } else {
        setPlaces(remaining)
      }
      // 강조한 곳(그림 지도는 지역)에 장소가 하나도 남지 않으면 강조를 푼다. 남아 있으면 그대로 둔다.
      if (!remaining.some((place) => pinKeyOf(place, mapMode) === selectedKey)) {
        setSelectedKey(null)
      }
    } catch (error) {
      // 지우지 못하면 카드는 그대로 둔다 (SCREEN-SPEC 4절 5번).
      setDeleteError(error)
    }
    setDeleting(false)
  }

  let content = null
  if (status === 'loading') {
    content = <StatusMessage kind="loading" />
  } else if (status === 'error') {
    content = (
      <StatusMessage
        kind="error"
        message="장소를 불러오지 못했어요."
        onRetry={() => loadPlaces(selectedId, page)}
      />
    )
  } else if (status === 'done' && places.length === 0) {
    // 장소가 없으면 지도도 보이지 않는다 (2026-10-22 사람이 정함).
    content = <StatusMessage kind="empty" message="아직 넣은 장소가 없어요." />
  } else if (status === 'done') {
    // PC(768px 이상)는 왼쪽 지도·오른쪽 장소 목록, 모바일은 지도 → 목록으로 쌓는다.
    // 전체 보기의 지도에는 지금 페이지의 장소 핀만 보인다 (D-034).
    content = (
      <div className={styles.layout}>
        <div className={styles.mapColumn}>
          <PlaceMap
            places={places}
            mode={mapMode}
            selectedKey={selectedKey}
            onSelect={handlePinSelect}
          />
          <p className={styles.mapCaption}>솟대를 누르면 그곳의 기록이 강조돼요</p>
        </div>
        {/* 페이지 버튼은 목록 칸 아래 가운데에 둔다 */}
        <div>
          <ul className={styles.list} ref={listRef} data-stagger>
            {places.map((place) => {
              const highlighted = pinKeyOf(place, mapMode) === selectedKey
              return (
                <li key={place.id} data-highlighted={highlighted}>
                  <PlaceCard
                    place={place}
                    highlighted={highlighted}
                    actions={
                      ownTripIds.has(place.trip_id) && (
                        <>
                          <Button variant="secondary" to={`/place/${place.id}/edit`}>
                            수정
                          </Button>
                          <Button variant="secondary" onClick={() => openDelete(place)}>
                            삭제
                          </Button>
                        </>
                      )
                    }
                  />
                </li>
              )
            })}
          </ul>
          {showAll && (
            <Pagination
              page={page}
              totalPages={Math.ceil(total / PAGE_SIZE)}
              onChange={handlePageChange}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <section className={styles.page}>
      {/* "장소 추가"는 여행 기록·여행 일기처럼 제목 오른쪽에 둔다 (2026-10-23 사람이 정함). */}
      <div className={styles.header}>
        {/* 섹션 이름표 + 화면 제목 (2026-10-23 팀 합의, DESIGN 6절 "화면 머리") */}
        <div className={styles.titleBox}>
          <p className={styles.kicker}>답사 수첩</p>
          <h1>여행 장소</h1>
        </div>
        {selectedTrip && ownTripIds.has(selectedTrip.id) && (
          <Button to={`/place/new?trip=${selectedTrip.id}`}>장소 추가</Button>
        )}
      </div>
      <div className={styles.tripField}>
        <TripSelect value={selectedId} onChange={handleTripChange} onLoad={setTrips} />
        {/* 전체 보기에서는 "장소 추가" 대신 안내를 둔다 (SCREEN-SPEC 4절 2번, AI 제안 문구).
            로그인하지 않았으면 추가할 수 없으므로 보이지 않는다 (D-042) */}
        {showAll && user && <p className={styles.guide}>여행을 고르면 장소를 추가할 수 있어요.</p>}
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
