import { useCallback, useEffect, useRef, useState } from 'react'
import { searchKakaoPlaces } from '../../api/places.js'
import Pagination from '../../components/Pagination/Pagination.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import styles from './PlaceSearchDialog.module.css'

// 장소 검색 결과 창 (담당: 은희). SCREEN-SPEC 4절 2·5번, DESIGN 6절 "입력 칸".
// keyword: 검색할 말. 창이 열릴 때 1페이지를 부르고, 페이지 버튼으로 5개씩 넘긴다 (D-036).
// onPick(item): 결과 줄을 누르면 그 장소를 넘긴다. 고를 수 없으면 오류 문구를 돌려주고 창은 열려 있다.
// onClose(): 닫기 버튼, Esc, 창 바깥을 누르면 부른다.
export default function PlaceSearchDialog({ keyword, onPick, onClose }) {
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null) // { items, totalPages }
  const [status, setStatus] = useState('loading')
  const [pickError, setPickError] = useState(null)
  const dialogRef = useRef(null)
  const listRef = useRef(null)

  const search = useCallback(
    async (pageNumber, isCurrent = () => true) => {
      setStatus('loading')
      setPickError(null)
      try {
        const loaded = await searchKakaoPlaces(keyword, pageNumber)
        if (!isCurrent()) return
        setResult(loaded)
        setStatus('done')
      } catch {
        if (isCurrent()) setStatus('error')
      }
    },
    [keyword],
  )

  // 페이지를 빠르게 넘겼을 때 앞서 부른 응답이 늦게 와도 덮어쓰지 않게 한다.
  useEffect(() => {
    let current = true
    search(page, () => current)
    return () => {
      current = false
    }
  }, [search, page])

  // 창이 열리면 창에 포커스를 두고, Esc로 닫는다.
  useEffect(() => {
    dialogRef.current?.focus()
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handlePageChange(nextPage) {
    setPage(nextPage)
    listRef.current?.scrollTo({ top: 0 })
  }

  function handlePick(item) {
    const error = onPick(item)
    if (error) setPickError(error)
  }

  let content
  if (status === 'loading') {
    // 공통 로딩 문구("불러오는 중…") 대신 검색 문구를 쓴다 (SCREEN-SPEC 4절 5번).
    content = (
      <p className={styles.loading} role="status">
        검색하는 중…
      </p>
    )
  } else if (status === 'error') {
    content = (
      <StatusMessage
        kind="error"
        message="장소를 검색하지 못했어요. 다시 시도해 주세요."
        onRetry={() => search(page)}
      />
    )
  } else if (result.items.length === 0) {
    content = <StatusMessage kind="empty" message="검색 결과가 없어요." />
  } else {
    content = (
      <>
        <ul className={styles.results}>
          {result.items.map((item) => (
            <li key={item.id}>
              <button type="button" className={styles.result} onClick={() => handlePick(item)}>
                <span className={styles.resultName}>{item.name}</span>
                <span className={styles.resultAddress}>{item.address}</span>
              </button>
            </li>
          ))}
        </ul>
        {pickError && <p className={styles.error}>{pickError}</p>}
      </>
    )
  }

  return (
    // 창 바깥(어두운 바탕)을 누르면 닫는다. 창 안을 누른 것은 닫지 않는다.
    <div className={styles.backdrop} onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="place-search-title"
        tabIndex={-1}
      >
        <div className={styles.head}>
          <p id="place-search-title" className={styles.title}>
            검색 결과
          </p>
          <button type="button" className={styles.close} onClick={onClose} aria-label="닫기">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <p className={styles.keyword}>‘{keyword}’</p>
        <div className={styles.body} ref={listRef}>
          {content}
        </div>
        {status === 'done' && (
          <Pagination page={page} totalPages={result.totalPages} onChange={handlePageChange} />
        )}
      </div>
    </div>
  )
}
