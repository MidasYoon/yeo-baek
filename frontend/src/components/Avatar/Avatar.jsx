import { useState } from 'react'
import { photoUrl } from '../../api/users.js'
import styles from './Avatar.module.css'

// 프로필사진 (팀 공동, D-042). DESIGN 6절 "회원·좋아요·댓글".
// 정사각형(모서리 4px, 원 모양은 쓰지 않음). 사진이 없거나 불러오지 못하면 닉네임 첫 글자를 넣은 사각.
// 옆에 닉네임 글자가 따로 있으므로 화면 읽기 프로그램에는 읽히지 않게 한다 (DESIGN 8절).
// size: 32(네비) · 36(댓글) · 96(회원상세 창)
export default function Avatar({ nickname, photo, size = 32 }) {
  const [broken, setBroken] = useState(null)
  const box = { width: size, height: size, fontSize: Math.round(size / 2) }

  if (photo && broken !== photo) {
    return (
      <img
        className={styles.avatar}
        style={box}
        src={photoUrl(photo)}
        alt=""
        onError={() => setBroken(photo)}
      />
    )
  }

  return (
    <span className={`${styles.avatar} ${styles.initial}`} style={box} aria-hidden="true">
      {Array.from(nickname ?? '')[0] ?? ''}
    </span>
  )
}
