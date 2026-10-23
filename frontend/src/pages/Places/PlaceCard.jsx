import { useCallback, useState } from 'react'
import { photoUrl } from '../../api/places.js'
import LanternRating from './LanternRating.jsx'
import PhotoViewer from './PhotoViewer.jsx'
import styles from './PlaceCard.module.css'

// 장소 목록의 줄 하나 (담당: 은희). SCREEN-SPEC 4절 2번, DESIGN 6절 "카드".
// 시안(한지 노을 · 여행지 정보)처럼 한 판 안에 줄로 쌓는다. 판 모양은 목록(ul)이 그린다.
// highlighted: 핀을 눌렀을 때 강조한다 (P-29).
// 전체 보기에서는 place.trip_name이 있어 지역·날짜 앞에 여행명을 붙인다 (D-034).
// actions: 수정·삭제 버튼 자리 (P-28). 여행 상세 안 목록(P-34)에서는 넘기지 않는다.
// 사진이 있으면 메모 아래에 작은 사진을 한 줄로 보인다. 없으면 줄을 두지 않는다 (D-033).
// 작은 사진을 누르면 그 사진부터 크게 보기 창이 열린다 (PhotoViewer).
// 장소 이름 아래에 별점 청사초롱 줄을 보인다. 별점이 없는 기존 장소는 줄이 없다 (D-043).

// 작은 사진 한 장. 불러오지 못하면 숨긴다 (SCREEN-SPEC 1절 "사진 표시").
function PlacePhoto({ filename, number, onOpen }) {
  const [broken, setBroken] = useState(false)
  if (broken) return null
  return (
    <li>
      <button
        type="button"
        className={styles.photoButton}
        onClick={onOpen}
        aria-label={`장소 사진 ${number} 크게 보기`}
      >
        <img
          className={styles.photo}
          src={photoUrl(filename)}
          alt=""
          onError={() => setBroken(true)}
        />
      </button>
    </li>
  )
}
export default function PlaceCard({ place, highlighted = false, actions = null }) {
  const className = highlighted ? `${styles.row} ${styles.highlighted}` : styles.row
  // 크게 보기로 연 사진의 순번. null이면 닫힘.
  const [viewIndex, setViewIndex] = useState(null)
  const closeViewer = useCallback(() => setViewIndex(null), [])

  return (
    <article className={className}>
      <div className={styles.body}>
        {/* 지역은 작은 사각 도장 이름표로 보인다. 글자는 전과 같다 ("여행명 · 지역 · 날짜") (2026-10-23 답사 수첩) */}
        <p className={styles.meta}>
          {place.trip_name && `${place.trip_name} · `}
          <span className={styles.region}>{place.region}</span> · {place.visit_date} · 
        <LanternRating value={place.rating} />
        </p>
        <h3 className={styles.name}>
          {/* 지도 솟대와 같은 모양의 작은 솟대 (장식) */}
          <svg className={styles.flag} viewBox="0 0 16 22" aria-hidden="true">
            <path d="M8 21V7" stroke="#6e4630" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M2 6Q4.5 2.5 8.5 3.5Q11 1.5 13 2Q11.5 3.5 12 4.5L14 5Q11.5 6.5 8.5 6.5Q4.5 7.5 2 6Z" fill="currentColor" />
            <path d="M13 2l1.6-.4-1 1.2z" fill="#c99a2e" />
          </svg>
          {place.name}
        </h3>
        {place.memo && <p className={styles.memo}>{place.memo}</p>}
        {place.photos?.length > 0 && (
          <ul className={styles.photos}>
            {place.photos.map((filename, i) => (
              <PlacePhoto key={filename} filename={filename} number={i + 1} onOpen={() => setViewIndex(i)} />
            ))}
          </ul>
        )}
        {viewIndex !== null && (
          <PhotoViewer photos={place.photos} startIndex={viewIndex} onClose={closeViewer} />
        )}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </article>
  )
}
