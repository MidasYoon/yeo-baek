import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getMe } from '../../api/users.js'

// 로그인 상태 (팀 공동, D-042). ARCHITECTURE 5절 "로그인 상태 나눠 주기".
// 앱을 열 때 GET /api/users/me를 한 번 불러 모든 화면에 나눠 준다.
// - user: 로그인한 회원 객체, 로그인하지 않았으면 null
// - loading: 처음 불러오는 중인지. 불러오지 못하면 로그인하지 않은 것으로 본다 (SCREEN-SPEC 8절 5번)
// - setUser(user): 로그인·가입·정보수정·로그아웃 뒤 받은 값으로 바꾼다
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      setUser(await getMe())
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(() => ({ user, loading, setUser, refresh }), [user, loading, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
