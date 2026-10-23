import Button from '../Button/Button.jsx'
import StatusMessage from '../StatusMessage/StatusMessage.jsx'
import { NOT_OWNER_TEXT } from './AuthErrorText.jsx'
import styles from './NotOwnerMessage.module.css'

// 남의 기록 수정 화면 (팀 공동, D-042). SCREEN-SPEC 1절 "남의 기록 수정 화면".
// 로그인했지만 남의 여행·장소·일기의 수정·추가 주소를 열면 폼 대신 이 문구와 "목록으로"를 보인다.
export default function NotOwnerMessage({ to }) {
  return (
    <>
      <StatusMessage kind="error" message={NOT_OWNER_TEXT} />
      <div className={styles.center}>
        <Button variant="secondary" to={to}>
          목록으로
        </Button>
      </div>
    </>
  )
}
