import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { likeTrip, unlikeTrip } from '../../api/likes.js'
import { useAuth } from '../Auth/AuthContext.jsx'
import AuthErrorText from '../Auth/AuthErrorText.jsx'
import { loginUrl } from '../Auth/loginPaths.js'
import styles from './LikeButton.module.css'

// 여행 좋아요 버튼 (팀 공동, D-042). SCREEN-SPEC 8절, DESIGN 6절 "좋아요 버튼".
// 여행 객체의 like_count·liked로 시작하고, 누르면 서버가 돌려준 상태로 바꾼다.
// 로그인하지 않았으면 로그인 화면으로 보낸다. 실패하면 하트·수는 누르기 전으로 남는다.
// 다른 여행으로 옮겨 가면 부르는 쪽이 key로 새로 그린다.
export default function LikeButton({ tripId, likeCount, liked }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [state, setState] = useState({ likeCount, liked })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  // 누를 때마다 하트를 한 번 키웠다 돌린다 (key를 바꿔 애니메이션을 다시 시작)
  const [pops, setPops] = useState(0)

  async function handleClick() {
    if (!user) {
      navigate(loginUrl(location.pathname + location.search))
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = state.liked ? await unlikeTrip(tripId) : await likeTrip(tripId)
      setState({ likeCount: result.like_count, liked: result.liked })
      setPops((count) => count + 1)
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={state.liked ? `${styles.button} ${styles.on}` : styles.button}
        aria-pressed={state.liked}
        disabled={busy}
        onClick={handleClick}
      >
        <svg
          key={pops}
          className={pops > 0 ? `${styles.heart} ${styles.pop}` : styles.heart}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"
            fill={state.liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        좋아요 {state.likeCount}
      </button>
      {error && (
        <p className={styles.error} role="alert">
          <AuthErrorText error={error} fallback="좋아요를 바꾸지 못했어요. 다시 시도해 주세요." />
        </p>
      )}
    </div>
  )
}
