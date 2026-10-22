import { useEffect, useRef, useState } from 'react'
import { photoUrl } from '../../api/places.js'
import styles from './PhotoViewer.module.css'

// 장소 사진 크게 보기 (담당: 은희, 사진 작업은 팀 공동). SCREEN-SPEC 4절 2번, DESIGN 6절 "사진".
// photos: 그 장소의 사진 파일 이름 목록. startIndex: 처음 보일 사진. onClose(): 닫기.
// 끝에서 넘기면 반대쪽 끝으로 돌아간다. 배경 누르기·Esc로 닫고, ←·→ 키로도 넘긴다.
export default function PhotoViewer({ photos, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex)
  const closeRef = useRef(null)
  const count = photos.length
  const many = count > 1

  function move(step) {
    setIndex((prev) => (prev + step + count) % count)
  }

  useEffect(() => {
    closeRef.current?.focus()
    function handleKey(event) {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowLeft' && count > 1) setIndex((prev) => (prev - 1 + count) % count)
      else if (event.key === 'ArrowRight' && count > 1) setIndex((prev) => (prev + 1) % count)
    }
    document.addEventListener('keydown', handleKey)
    // 창이 열린 동안 뒤 화면이 스크롤되지 않게 한다.
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = overflow
    }
  }, [count, onClose])

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="장소 사진 크게 보기"
      onClick={onClose}
    >
      {/* 사진·버튼을 눌렀을 때는 닫히지 않게 한다. */}
      <div className={styles.stage} onClick={(event) => event.stopPropagation()}>
        <img className={styles.photo} src={photoUrl(photos[index])} alt={`장소 사진 ${index + 1}`} />
        {many && (
          <p className={styles.counter}>
            {index + 1} / {count}
          </p>
        )}
      </div>
      {/* 화살표는 사진이 아니라 화면 양 끝에 고정한다. 사진 크기가 달라도 자리가 움직이지 않는다. */}
      {many && (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.prev}`}
            onClick={(event) => {
              event.stopPropagation()
              move(-1)
            }}
            aria-label="이전 사진"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.next}`}
            onClick={(event) => {
              event.stopPropagation()
              move(1)
            }}
            aria-label="다음 사진"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </>
      )}
      <button ref={closeRef} type="button" className={styles.close} onClick={onClose} aria-label="닫기">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
    </div>
  )
}
