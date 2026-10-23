import { useCallback, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../Auth/AuthContext.jsx'
import { loginUrl } from '../Auth/loginPaths.js'
import Avatar from '../Avatar/Avatar.jsx'
import RecommendChat from '../RecommendChat/RecommendChat.jsx'
import ScrollTopButton from '../ScrollTopButton/ScrollTopButton.jsx'
import UserModal from '../UserModal/UserModal.jsx'
import styles from './Layout.module.css'

// 공통 레이아웃 (담당: 건용). SCREEN-SPEC 2절. 메뉴 이름은 한글 (D-032), 주소는 그대로 (D-012).
const MENUS = [
  { to: '/trip', label: '여행' },
  { to: '/place', label: '장소' },
  { to: '/diary', label: '일기' },
]

// 네비 오른쪽 끝 회원 자리 (D-042, SCREEN-SPEC 2절·8절 2번, DESIGN 6절 "네비 회원 자리").
// 불러오는 중에는 비어 있고, 로그인하지 않았으면 "로그인", 했으면 프로필사진 + 닉네임 버튼.
function AccountArea() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)

  const close = useCallback(() => {
    setOpen(false)
    buttonRef.current?.focus()
  }, [])

  if (loading) return <div className={styles.account} />

  if (!user) {
    // 로그인·회원가입 화면에서는 지금의 next를 그대로 둔다.
    const onAuthPage = location.pathname === '/login' || location.pathname === '/signup'
    const to = onAuthPage
      ? `/login${location.search}`
      : loginUrl(location.pathname + location.search)
    return (
      <div className={styles.account}>
        <Link to={to} className={styles.loginLink}>
          로그인
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.account}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.userButton}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`${user.nickname} 회원 정보`}
      >
        <Avatar nickname={user.nickname} photo={user.profile_photo} size={32} />
        <span className={styles.nickname}>{user.nickname}</span>
      </button>
      {open && <UserModal onClose={close} />}
    </div>
  )
}

export default function Layout() {
  return (
    <>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link to="/" className={styles.logo}>
            {/* 처마 로고: 끝이 올라간 주홍 지붕 + 쪽빛 보 + 먹 기둥 두 개 (DESIGN 6절 "네비", 7절) */}
            <svg className={styles.logoMark} viewBox="0 0 34 30" aria-hidden="true">
              <path className={styles.logoRoof} d="M1 13Q5 17 9 17L25 17Q29 17 33 13L26 6L8 6Z" />
              <path className={styles.logoInk} d="M6 5Q8 6.5 10 6L24 6Q26 6.5 28 5" />
              <rect className={styles.logoBeam} x="8" y="17" width="18" height="3" />
              <path className={styles.logoInk} d="M10 20v8M24 20v8M5 28h24" />
            </svg>
            여백
          </Link>
          <ul className={styles.menu}>
            {MENUS.map((menu) => (
              <li key={menu.to}>
                <NavLink
                  to={menu.to}
                  className={({ isActive }) =>
                    isActive ? `${styles.link} ${styles.active}` : styles.link
                  }
                  data-label={menu.label}
                >
                  {menu.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <AccountArea />
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      {/* 화면을 길게 내리면 오른쪽 아래, 추천 버튼 위에 나타난다 (2026-10-23) */}
      <ScrollTopButton />
      {/* AI 여행지 추천 버튼과 대화창 (D-037, SCREEN-SPEC 7절). 모든 화면 오른쪽 아래에 뜬다 */}
      <RecommendChat />
    </>
  )
}
