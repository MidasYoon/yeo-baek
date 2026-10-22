import Button from '../Button/Button.jsx'
import styles from './StatusMessage.module.css'

// 빈 상태·로딩·오류 표시 (팀 공동, D-028). SCREEN-SPEC 1절, DESIGN 6절 "상태 표시".
// kind: 'loading' | 'empty' | 'error'
// - loading: "불러오는 중…"
// - empty: message + (있으면) action 버튼
// - error: message + "다시 시도" 버튼 (onRetry가 있을 때)
export default function StatusMessage({ kind, message, onRetry, action }) {
  if (kind === 'loading') {
    return (
      <p className={`${styles.box} ${styles.loading}`} role="status">
        불러오는 중…
      </p>
    )
  }

  if (kind === 'error') {
    return (
      <div className={styles.box} role="alert">
        <p className={styles.error}>{message}</p>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            다시 시도
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={`${styles.box} ${styles.empty}`}>
      <p className={styles.emptyText}>{message}</p>
      {action}
    </div>
  )
}
