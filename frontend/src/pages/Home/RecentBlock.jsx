import { Link } from 'react-router-dom'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import styles from './Home.module.css'

// Home 블록 하나 (담당: 은희). SCREEN-SPEC 6절 2·5번.
// label: 카드 이름표 ("최근 여행" 등). tone: 'trip'|'place'|'diary' — 이름표 색과 색동 순서. state: { status: 'loading'|'done'|'error', data }
// to: 카드를 누르면 갈 곳. linkState: (선택) 갈 화면에 함께 넘길 값 (react-router의 Link state). emptyMessage·errorMessage: 문구. onRetry: 이 블록만 다시 부른다.
// renderCard(data): 카드 안 내용. 빈 상태·오류일 때는 카드를 눌러도 다른 화면으로 가지 않는다.
export default function RecentBlock({ label, tone, state, to, linkState, emptyMessage, errorMessage, onRetry, renderCard }) {
  let body
  if (state.status === 'loading') {
    body = <StatusMessage kind="loading" />
  } else if (state.status === 'error') {
    body = <StatusMessage kind="error" message={errorMessage} onRetry={onRetry} />
  } else if (!state.data) {
    body = <StatusMessage kind="empty" message={emptyMessage} />
  }

  if (body) {
    return (
      <div className={styles.card}>
        <span className={`${styles.stripe} ${styles[`stripe_${tone}`]}`} aria-hidden="true" />
        <span className={`${styles.label} ${styles[`label_${tone}`]}`}>{label}</span>
        <div className={styles.cardState}>{body}</div>
      </div>
    )
  }

  return (
    <Link to={to} state={linkState} className={`${styles.card} ${styles.cardLink}`}>
      <span className={`${styles.stripe} ${styles[`stripe_${tone}`]}`} aria-hidden="true" />
      <span className={`${styles.label} ${styles[`label_${tone}`]}`}>{label}</span>
      {renderCard(state.data)}
    </Link>
  )
}
