import { Link, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.jsx'
import { loginUrl } from './loginPaths.js'

// 저장·지우기 실패 문구 (팀 공동, D-042). SCREEN-SPEC 1절 "저장·지우기 중 로그인이 풀림", "저장·지우기에 403".
// error: api/ 함수가 던진 Error (status가 있다). fallback: 그 밖의 실패 문구 (공통 저장·지우기 실패).
// notOwnerText: 403 문구 (댓글은 "내 댓글만 지울 수 있어요.").
export const NOT_OWNER_TEXT = '내 여행만 고칠 수 있어요.'

export default function AuthErrorText({ error, fallback, notOwnerText = NOT_OWNER_TEXT }) {
  const { setUser } = useAuth()
  const location = useLocation()

  if (error?.status === 401) {
    return (
      <>
        로그인이 풀렸어요. 다시 로그인해 주세요.{' '}
        {/* 화면에 남은 로그인 상태를 비워야 로그인 화면이 폼을 보인다 */}
        <Link to={loginUrl(location.pathname + location.search)} onClick={() => setUser(null)}>
          로그인
        </Link>
      </>
    )
  }
  if (error?.status === 403) return notOwnerText
  return fallback
}
