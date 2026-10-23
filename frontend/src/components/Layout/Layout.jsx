import { Link, NavLink, Outlet } from 'react-router-dom'
import ScrollTopButton from '../ScrollTopButton/ScrollTopButton.jsx'
import styles from './Layout.module.css'

// 공통 레이아웃 (담당: 건용). SCREEN-SPEC 2절. 메뉴 이름은 한글 (D-032), 주소는 그대로 (D-012).
const MENUS = [
  { to: '/trip', label: '여행' },
  { to: '/place', label: '장소' },
  { to: '/diary', label: '일기' },
]

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
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      {/* 화면을 길게 내리면 오른쪽 아래에 나타난다 (2026-10-23) */}
      <ScrollTopButton />
    </>
  )
}
