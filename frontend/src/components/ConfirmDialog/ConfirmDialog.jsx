import Button from '../Button/Button.jsx'
import styles from './ConfirmDialog.module.css'

// 지우기 확인 창 (팀 공동, D-028). SCREEN-SPEC 1절, DESIGN 6절 "상태 표시".
// open이 true일 때만 보인다.
// busy: 지우는 중이면 "지우기"를 누를 수 없다.
// error: 지우기에 실패하면 버튼 위에 실패 문구를 보인다. true면 공통 문구, 글자·요소면 그것을 보인다
//   (로그인이 풀렸을 때·남의 기록일 때의 문구, D-042).
export default function ConfirmDialog({ open, busy = false, error = false, onCancel, onConfirm }) {
  if (!open) return null

  return (
    <div className={styles.backdrop}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <p id="confirm-dialog-title" className={styles.title}>
          정말 지울까요?
        </p>
        {error && (
          <p className={styles.error}>
            {error === true ? '지우지 못했어요. 다시 시도해 주세요.' : error}
          </p>
        )}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel}>
            취소
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={busy}>
            지우기
          </Button>
        </div>
      </div>
    </div>
  )
}
