import { Link, NavLink, Outlet } from 'react-router-dom'
import styles from './Layout.module.css'

// 공통 레이아웃 (담당: 건용). SCREEN-SPEC 2절.
const MENUS = [
  { to: '/trip', label: 'trip' },
  { to: '/place', label: 'place' },
  { to: '/diary', label: 'diary' },
]

export default function Layout() {
  return (
    <>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link to="/" className={styles.logo}>
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
    </>
  )
}
