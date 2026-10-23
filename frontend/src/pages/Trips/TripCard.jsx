import { useState } from 'react'
import { Link } from 'react-router-dom'
import { photoUrl } from '../../api/trips.js'
import styles from './TripCard.module.css'

// 여행 카드 하나 (담당: 서준). SCREEN-SPEC 3절 2번, DESIGN 5·6·7절.
// 조각보 무늬는 목록 순서대로 3가지를 돌려 쓴다 (index % 3).
// 대표사진이 있으면 조각보 자리에 사진을 보이고, 없거나 불러오지 못하면 조각보를 보인다 (D-033).
const PATCHWORK = [
  ['accent', 'gold', 'indigo', 'green', 'sunken', 'accent', 'indigo', 'accent', 'gold'],
  ['indigo', 'accent', 'green', 'gold', 'indigo', 'sunken', 'accent', 'green', 'indigo'],
  ['green', 'sunken', 'accent', 'indigo', 'gold', 'green', 'gold', 'accent', 'sunken'],
]

export default function TripCard({ trip, index }) {
  const pattern = PATCHWORK[index % PATCHWORK.length]
  const [brokenPhoto, setBrokenPhoto] = useState(null)
  const showPhoto = trip.photo && trip.photo !== brokenPhoto

  return (
    <Link to={`/trip/${trip.id}`} className={styles.card}>
      {/* 책 표지 (여행 책장, 2026-10-23 팀 합의). 조각보 표지에만 왼쪽 책등 선을 겹친다. 사진 위에는 장식을 두지 않는다 (DESIGN 7절) */}
      <span className={showPhoto ? styles.cover : `${styles.cover} ${styles.bound}`}>
        {showPhoto ? (
          <img
            className={styles.photo}
            src={photoUrl(trip.photo)}
            alt="여행 대표사진"
            onError={() => setBrokenPhoto(trip.photo)}
          />
        ) : (
          <span className={styles.patchwork} aria-hidden="true">
            {pattern.map((color, i) => (
              <span key={i} className={styles[color]} />
            ))}
          </span>
        )}
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{trip.name}</span>
        <span className={styles.meta}>
          <span className={styles.destination}>{trip.destination}</span> · {trip.start_date} ~ {trip.end_date}
        </span>
      </span>
      <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </Link>
  )
}
