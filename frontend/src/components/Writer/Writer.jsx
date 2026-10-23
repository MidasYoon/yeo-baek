import Avatar from '../Avatar/Avatar.jsx'
import styles from './Writer.module.css'

// 작성자 줄: 프로필사진 + 닉네임 (팀 공동, D-047). DESIGN 6절 "작성자 줄".
// 여행 카드·장소 카드·일기 줄(사진 20px), select 아래 줄(20px), 여행 상세(32px)가 같은 모양을 쓴다.
// 사진이 없거나 불러오지 못하면 Avatar가 닉네임 첫 글자 사각을 보인다.
// labeled: true면 화면 읽기 프로그램에만 "기록한 사람 "을 앞에 붙여 읽힌다 (여행 상세, select 아래 줄).
// 글자 크기·색은 부르는 쪽이 className으로 정한다.
export default function Writer({ nickname, photo, size = 20, labeled = false, className }) {
  const classNames = [styles.writer, className].filter(Boolean).join(' ')
  return (
    <span className={classNames}>
      <Avatar nickname={nickname} photo={photo} size={size} />
      <span className={styles.name}>
        {labeled && <span className={styles.srOnly}>기록한 사람 </span>}
        {nickname}
      </span>
    </span>
  )
}
