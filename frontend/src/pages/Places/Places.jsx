import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { deletePlace, getPlaces } from '../../api/places.js'
import Button from '../../components/Button/Button.jsx'
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import TripSelect from '../../components/TripSelect/TripSelect.jsx'
import PlaceCard from './PlaceCard.jsx'
import PlaceMap from './PlaceMap.jsx'
import styles from './Places.module.css'

// 여행지 정보 목록 (담당: 은희). SCREEN-SPEC 4절. 주소: /place, /place?trip=:tripId
export default function Places() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tripParam = searchParams.get('trip')
  const [trips, setTrips] = useState(null)
  const [places, setPlaces] = useState([])
  const [status, setStatus] = useState('idle')
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteFailed, setDeleteFailed] = useState(false)
  const listRef = useRef(null)

  // 주소의 여행 번호가 여행 목록에 있을 때만 고른 것으로 본다 (없는 번호면 빈 select).
  const selectedTrip = trips?.find((trip) => String(trip.id) === tripParam) ?? null
  const selectedId = selectedTrip?.id ?? null

  const loadPlaces = useCallback(async (tripId, isCurrent = () => true) => {
    setStatus('loading')
    try {
      const loaded = await getPlaces(tripId)
      if (!isCurrent()) return
      setPlaces(loaded)
      setStatus('done')
    } catch {
      if (isCurrent()) setStatus('error')
    }
  }, [])

  useEffect(() => {
    // 여행을 바꾸면 핀 강조는 풀린다 (SCREEN-SPEC 4절 3번).
    setSelectedRegion(null)
    if (selectedId === null) {
      setStatus('idle')
      return
    }
    // 여행을 빠르게 바꿨을 때 앞서 부른 응답이 늦게 와도 덮어쓰지 않게 한다.
    let current = true
    loadPlaces(selectedId, () => current)
    return () => {
      current = false
    }
  }, [selectedId, loadPlaces])

  // 핀을 누르면 강조된 카드 중 첫 카드가 화면에 보이도록 목록을 움직인다 (AI 제안).
  useEffect(() => {
    if (!selectedRegion) return
    listRef.current
      ?.querySelector('[data-highlighted="true"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedRegion])

  function handleTripChange(trip) {
    if (trip) setSearchParams({ trip: String(trip.id) })
  }

  function handlePinSelect(region) {
    // 같은 핀을 다시 누르면 강조가 풀린다.
    setSelectedRegion((prev) => (prev === region ? null : region))
  }

  function openDelete(place) {
    setDeleteFailed(false)
    setDeleteTarget(place)
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteFailed(false)
    try {
      await deletePlace(deleteTarget.id)
      const remaining = places.filter((place) => place.id !== deleteTarget.id)
      setPlaces(remaining)
      setDeleteTarget(null)
      // 강조한 지역에 장소가 하나도 남지 않으면 강조를 푼다. 남아 있으면 그대로 둔다.
      if (!remaining.some((place) => place.region === selectedRegion)) {
        setSelectedRegion(null)
      }
    } catch {
      // 지우지 못하면 카드는 그대로 둔다 (SCREEN-SPEC 4절 5번).
      setDeleteFailed(true)
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
        onRetry={() => loadPlaces(selectedId)}
      />
    )
  } else if (status === 'done' && places.length === 0) {
    // 장소가 없으면 지도도 보이지 않는다 (2026-10-22 사람이 정함).
    content = <StatusMessage kind="empty" message="아직 넣은 장소가 없어요." />
  } else if (status === 'done') {
    // PC(768px 이상)는 왼쪽 지도·오른쪽 장소 목록, 모바일은 지도 → 목록으로 쌓는다.
    content = (
      <div className={styles.layout}>
        <div className={styles.mapColumn}>
          <PlaceMap places={places} selectedRegion={selectedRegion} onSelect={handlePinSelect} />
        </div>
        <ul className={styles.list} ref={listRef}>
            {places.map((place) => {
              const highlighted = place.region === selectedRegion
              return (
                <li key={place.id} data-highlighted={highlighted}>
                  <PlaceCard
                    place={place}
                    highlighted={highlighted}
                    actions={
                      <>
                        <Button variant="text" to={`/place/${place.id}/edit`}>
                          수정
                        </Button>
                        <Button variant="text" onClick={() => openDelete(place)}>
                          삭제
                        </Button>
                      </>
                    }
                  />
                </li>
              )
            })}
        </ul>
      </div>
    )
  } else if (trips?.length > 0 && selectedId === null) {
    // 여행을 고르기 전 안내 (2026-10-22 사람이 요청, AI 제안 문구)
    content = (
      <StatusMessage
        kind="empty"
        message="여행을 고르면 그 여행에서 다녀온 곳을 지도와 카드로 볼 수 있어요."
      />
    )
  }

  return (
    <section className={styles.page}>
      <h1>여행지 정보</h1>
      <TripSelect value={selectedId} onChange={handleTripChange} onLoad={setTrips} />
      {selectedTrip && (
        <div className={styles.toolbar}>
          <Button to={`/place/new?trip=${selectedTrip.id}`}>장소 추가</Button>
        </div>
      )}
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
