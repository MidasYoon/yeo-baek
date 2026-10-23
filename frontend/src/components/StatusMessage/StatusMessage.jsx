import Button from '../Button/Button.jsx'
import styles from './StatusMessage.module.css'

// 빈 상태·로딩·오류 표시 (팀 공동, D-028). SCREEN-SPEC 1절, DESIGN 6절 "상태 표시".
// kind: 'loading' | 'empty' | 'error'
// - loading: 색동 마름모 인디케이터 + "불러오는 중…"(message로 바꿀 수 있다). 0.25초 뒤에 서서히 나타나
//   빨리 끝나는 로딩은 깜빡이지 않는다. 글자는 처음부터 있어 화면 읽기 프로그램은 바로 읽는다 (2026-10-23)
// - empty: message + (있으면) action 버튼
// - error: message + "다시 시도" 버튼 (onRetry가 있을 때)
export default function StatusMessage({ kind, message, onRetry, action }) {
  if (kind === 'loading') {
    return (
      <div className={`${styles.box} ${styles.loading}`} role="status">
        <span className={styles.dots} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <span>{message ?? '불러오는 중…'}</span>
      </div>
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
