import { useState } from 'react'
import styles from './LanternRating.module.css'

// 장소 별점 1~5를 청사초롱으로 보인다 (담당: 은희). D-043, DESIGN 6절 "장소 별점: 청사초롱".
// 불 밝힌 초롱 수가 점수다. 장소 카드·여행 상세·Home 최근 장소가 보기용 줄을, 장소 폼이 고르기용 줄을 쓴다.

const SCORES = [1, 2, 3, 4, 5]

// 초롱 하나: 먹 뚜껑 → 위 쪽빛·아래 주홍 몸통 → 먹 술. 꺼지면 테만 남는다.
function Lantern({ lit, preview = false }) {
  const className = [styles.lantern, lit && styles.lit, preview && styles.preview]
    .filter(Boolean)
    .join(' ')
  return (
    <svg className={className} viewBox="0 0 12 16" aria-hidden="true">
      <rect className={styles.cap} x="3.5" y="0.5" width="5" height="1.5" rx="0.5" />
      <rect className={styles.top} x="1" y="2.5" width="10" height="5.5" rx="1" />
      <rect className={styles.bottom} x="1" y="8" width="10" height="5.5" rx="1" />
      <path className={styles.tassel} d="M6 13.5V16" />
    </svg>
  )
}

// 보기용 줄. 별점이 없는 기존 장소(null)는 줄을 보이지 않는다 (R-P-028).
export default function LanternRating({ value }) {
  if (value == null) return null
  return (
    <span className={styles.row} role="img" aria-label={`별점 5점 중 ${value}점`}>
      {SCORES.map((score) => (
        <Lantern key={score} lit={score <= value} />
      ))}
    </span>
  )
}

// 고르기용 줄. 라디오 버튼 5개를 감추고 이름표를 초롱으로 그린다 (DESIGN 8절).
// 고른 점수는 다른 점수로 바꿀 수만 있고 지울 수 없다 (R-P-027).
// 마우스를 올리면 그 초롱까지 흐리게 미리 켜진다 (DESIGN 6절).
export function LanternRatingInput({ value, onChange, labelId, invalid = false, describedBy }) {
  const [hover, setHover] = useState(null)
  const shown = hover ?? value ?? 0

  return (
    <div className={styles.inputRow}>
      <div
        className={invalid ? `${styles.group} ${styles.invalid}` : styles.group}
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        onMouseLeave={() => setHover(null)}
      >
        {SCORES.map((score) => (
          <label key={score} className={styles.option} onMouseEnter={() => setHover(score)}>
            <input
              type="radio"
              className={styles.radio}
              name="rating"
              value={score}
              checked={value === score}
              onChange={() => {
                // 키보드로 바꿔도 마우스 미리 보기가 남아 고른 점수와 다르게 보이지 않게 한다.
                setHover(null)
                onChange(score)
              }}
              aria-label={`${score}점`}
            />
            <Lantern lit={score <= shown} preview={hover !== null} />
          </label>
        ))}
      </div>
      {value ? (
        <span className={styles.score}>{value}점</span>
      ) : (
        <span className={styles.hint}>초롱을 눌러 골라 주세요</span>
      )}
    </div>
  )
}
