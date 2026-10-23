import { Navigate, useLocation } from 'react-router-dom'
import StatusMessage from '../StatusMessage/StatusMessage.jsx'
import { useAuth } from './AuthContext.jsx'
import { loginUrl } from './loginPaths.js'

// 로그인해야 열 수 있는 화면을 감싼다 (팀 공동, D-042). SCREEN-SPEC 1절 "로그인이 필요한 화면".
// 로그인 상태를 불러오는 동안은 "불러오는 중…", 로그인하지 않았으면 /login?next=지금 주소로 간다.
export default function RequireLogin({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <StatusMessage kind="loading" />
  if (!user) {
    return <Navigate to={loginUrl(location.pathname + location.search)} replace />
  }
  return children
}
