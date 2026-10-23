import { startTransition, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../../api/users.js'
import { useAuth } from '../Auth/AuthContext.jsx'
import { isLoginRequiredPath } from '../Auth/loginPaths.js'
import Avatar from '../Avatar/Avatar.jsx'
import Button from '../Button/Button.jsx'
import styles from './UserModal.module.css'

// 회원상세 창 (팀 공동, D-042). SCREEN-SPEC 8절, DESIGN 6절 "회원상세 창".
// 네비의 내 닉네임을 누르면 열린다. ×·Esc·창 바깥을 누르면 닫힌다 (onClose가 포커스를 네비로 돌린다).
export default function UserModal({ onClose }) {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const closeRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    closeRef.current?.focus()
    function handleKey(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!user) return null

  function handleEdit() {
    onClose()
    navigate('/me/edit')
  }

  async function handleLogout() {
    setBusy(true)
    setFailed(false)
    try {
      await logout()
    } catch {
      setFailed(true)
      setBusy(false)
      return
    }
    onClose()
    // 로그인이 필요한 화면에 있었으면 Home으로 간다. 아니면 지금 화면에 그대로 있다 (SCREEN-SPEC 8절 3번).
    // react-router는 화면 이동을 transition으로 그리므로, 로그인 상태도 같은 transition에서 비워야
    // 함께 반영된다. 따로 비우면 RequireLogin이 먼저 보고 /login으로 보낸다.
    startTransition(() => {
      if (isLoginRequiredPath(location.pathname)) navigate('/', { replace: true })
      setUser(null)
    })
  }

  function handleBackdrop(event) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div className={styles.backdrop} onMouseDown={handleBackdrop}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="user-modal-name">
        <button
          ref={closeRef}
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="회원 정보 닫기"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <div className={styles.profile}>
          <Avatar nickname={user.nickname} photo={user.profile_photo} size={96} />
          <p id="user-modal-name" className={styles.nickname}>
            {user.nickname}
          </p>
          <p className={styles.loginId}>@{user.login_id}</p>
          <p className={styles.joined}>가입일 {user.created_at.slice(0, 10)}</p>
        </div>
        {failed && <p className={styles.error}>로그아웃하지 못했어요. 다시 시도해 주세요.</p>}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleEdit}>
            정보 수정
          </Button>
          <Button variant="secondary" onClick={handleLogout} disabled={busy}>
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  )
}
