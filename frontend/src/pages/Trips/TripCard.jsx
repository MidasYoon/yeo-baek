import { Link } from 'react-router-dom'
import styles from './TripCard.module.css'

// 여행 카드 하나 (담당: 서준). SCREEN-SPEC 3절 2번, DESIGN 5·6·7절.
// 조각보 무늬는 목록 순서대로 3가지를 돌려 쓴다 (index % 3).
const PATCHWORK = [
  ['accent', 'gold', 'indigo', 'green', 'sunken', 'accent', 'indigo', 'accent', 'gold'],
  ['indigo', 'accent', 'green', 'gold', 'indigo', 'sunken', 'accent', 'green', 'indigo'],
  ['green', 'sunken', 'accent', 'indigo', 'gold', 'green', 'gold', 'accent', 'sunken'],
]

export default function TripCard({ trip, index }) {
  const pattern = PATCHWORK[index % PATCHWORK.length]

  return (
    <Link to={`/trip/${trip.id}`} className={styles.card}>
      <span className={styles.patchwork} aria-hidden="true">
        {pattern.map((color, i) => (
          <span key={i} className={styles[color]} />
        ))}
      </span>
      <span className={styles.body}>
        <span className={styles.name}>{trip.name}</span>
        <span className={styles.meta}>
          {trip.destination} · {trip.start_date} ~ {trip.end_date}
        </span>
      </span>
      <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </Link>
  )
}
