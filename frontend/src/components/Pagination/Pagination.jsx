import styles from './Pagination.module.css'

// 페이지 버튼 (팀 공동, D-028·D-034). SCREEN-SPEC 1절 "페이지 버튼", DESIGN 6절 "페이지 버튼".
// page: 지금 페이지 (1부터). totalPages: 모든 페이지 수.
// onChange(page): 다른 페이지 번호를 누르면 그 번호를 넘긴다. 주소(?page=)와 스크롤은 화면이 맡는다.
// 페이지가 하나뿐이면 아무것도 그리지 않는다.

const MAX_NUMBERS = 5 // 번호는 지금 페이지를 가운데로 최대 5개 (AI 제안)

function ArrowIcon({ direction }) {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={direction === 'prev' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  // 지금 페이지가 가운데에 오도록 보일 번호의 처음과 끝을 정한다. 끝 쪽에서는 앞으로 당긴다.
  const count = Math.min(MAX_NUMBERS, totalPages)
  const first = Math.min(Math.max(1, page - Math.floor(count / 2)), totalPages - count + 1)
  const numbers = Array.from({ length: count }, (_, i) => first + i)

  return (
    <nav className={styles.pagination} aria-label="페이지">
      <button
        type="button"
        className={styles.step}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="이전 페이지"
      >
        <ArrowIcon direction="prev" />
        <span className={styles.stepText}>이전</span>
      </button>
      {numbers.map((number) => {
        const current = number === page
        return (
          <button
            key={number}
            type="button"
            className={current ? `${styles.number} ${styles.current}` : styles.number}
            aria-current={current ? 'page' : undefined}
            onClick={() => {
              if (!current) onChange(number)
            }}
          >
            {number}
          </button>
        )
      })}
      <button
        type="button"
        className={styles.step}
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="다음 페이지"
      >
        <span className={styles.stepText}>다음</span>
        <ArrowIcon direction="next" />
      </button>
    </nav>
  )
}
