import { useEffect, useState } from 'react'
import styles from './ScrollTopButton.module.css'

// 맨 위로 버튼 (팀 공동, 2026-10-23 사람이 요청). DESIGN 6절 "맨 위로 버튼".
// 화면을 600px 넘게 내렸을 때만 오른쪽 아래에 나타나고, 누르면 맨 위로 올라간다.
// 움직임 줄이기를 켠 사용자는 부드럽게 올라가지 않고 바로 이동한다.
const SHOW_AFTER = 600

export default function ScrollTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const update = () => setVisible(window.scrollY > SHOW_AFTER)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  function scrollToTop() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      className={visible ? `${styles.button} ${styles.visible}` : styles.button}
      aria-label="맨 위로"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      onClick={scrollToTop}
    >
      {/* 처마 지붕 모양의 위쪽 화살표 (로고와 같은 계열) */}
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <path className={styles.roof} d="M3 13Q7 12 9 9L12 5L15 9Q17 12 21 13" />
        <path className={styles.stem} d="M12 9V20" />
      </svg>
    </button>
  )
}
