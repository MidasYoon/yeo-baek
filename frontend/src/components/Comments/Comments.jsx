import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { createComment, deleteComment, getComments } from '../../api/comments.js'
import { useAuth } from '../Auth/AuthContext.jsx'
import AuthErrorText from '../Auth/AuthErrorText.jsx'
import { loginUrl } from '../Auth/loginPaths.js'
import Avatar from '../Avatar/Avatar.jsx'
import Button from '../Button/Button.jsx'
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog.jsx'
import StatusMessage from '../StatusMessage/StatusMessage.jsx'
import styles from './Comments.module.css'

// 여행 상세의 댓글 칸 (팀 공동, D-042). SCREEN-SPEC 8절, DESIGN 6절 "댓글 칸·줄·쓰기 칸".
// 목록은 누구나 보고, 쓰기는 로그인한 회원, 지우기는 쓴 회원만 한다.
// 다른 여행으로 옮겨 가면 부르는 쪽이 key로 새로 그린다.
const MAX_LENGTH = 200

// "2026-10-23 16:20:00" → "2026-10-23 16:20"
function shortTime(value) {
  return value.slice(0, 16)
}

export default function Comments({ tripId }) {
  const { user } = useAuth()
  const location = useLocation()
  const [comments, setComments] = useState([])
  const [status, setStatus] = useState('loading')
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState(null)
  // 지우려고 고른 댓글 id. 있으면 확인 창을 연다
  const [deletingId, setDeletingId] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const load = useCallback(async (isCurrent = () => true) => {
    setStatus('loading')
    try {
      const loaded = await getComments(tripId)
      if (!isCurrent()) return
      setComments(loaded)
      setStatus('done')
    } catch {
      if (isCurrent()) setStatus('error')
    }
  }, [tripId])

  useEffect(() => {
    let current = true
    load(() => current)
    return () => {
      current = false
    }
  }, [load])

  async function handleSubmit(event) {
    event.preventDefault()
    const content = draft.trim()
    if (!content) return
    setPosting(true)
    setPostError(null)
    try {
      const created = await createComment(tripId, content)
      setComments((prev) => [...prev, created])
      setDraft('')
    } catch (error) {
      setPostError(error) // 적은 글은 그대로 남는다
    } finally {
      setPosting(false)
    }
  }

  function openDelete(id) {
    setDeletingId(id)
    setDeleteError(null)
  }

  async function handleDelete() {
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await deleteComment(deletingId)
      setComments((prev) => prev.filter((comment) => comment.id !== deletingId))
      setDeletingId(null)
    } catch (error) {
      setDeleteError(error)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <section className={styles.part}>
      {/* 장(章) 제목: 여행 상세의 "장소"·"일기" 제목(TripDetail.module.css .partTitle)과 같은 모양 */}
      <h2 className={styles.partTitle}>
        댓글
        {status === 'done' && <span className={styles.count}>{comments.length}개</span>}
        <span className={styles.rule} aria-hidden="true" />
      </h2>

      {status === 'loading' && <StatusMessage kind="loading" />}
      {status === 'error' && (
        <StatusMessage kind="error" message="댓글을 불러오지 못했어요." onRetry={() => load()} />
      )}
      {status === 'done' && comments.length === 0 && (
        <StatusMessage kind="empty" message="아직 댓글이 없어요." />
      )}
      {status === 'done' && comments.length > 0 && (
        <ul className={styles.list}>
          {comments.map((comment) => (
            <li key={comment.id} className={styles.row}>
              <Avatar nickname={comment.nickname} photo={comment.profile_photo} size={36} />
              <div className={styles.body}>
                <p className={styles.meta}>
                  <span className={styles.nickname}>{comment.nickname}</span>
                  <time className={styles.time} dateTime={comment.created_at.replace(' ', 'T')}>
                    {shortTime(comment.created_at)}
                  </time>
                </p>
                <p className={styles.content}>{comment.content}</p>
              </div>
              {/* 지우기는 쓴 회원에게만 보인다. 여행 주인도 남의 댓글은 못 지운다 (PRD 7절 6번) */}
              {user && user.id === comment.user_id && (
                <Button variant="secondary" className={styles.delete} onClick={() => openDelete(comment.id)}>
                  삭제
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <textarea
            className={styles.textarea}
            value={draft}
            maxLength={MAX_LENGTH}
            placeholder="댓글을 남겨 보세요"
            aria-label="댓글 내용"
            onChange={(event) => setDraft(event.target.value)}
          />
          {postError && (
            <p className={styles.error} role="alert">
              <AuthErrorText error={postError} fallback="댓글을 쓰지 못했어요. 다시 시도해 주세요." />
            </p>
          )}
          <div className={styles.formFoot}>
            <span className={styles.counter}>
              {draft.length}/{MAX_LENGTH}
            </span>
            <Button type="submit" disabled={posting || !draft.trim()}>
              댓글 쓰기
            </Button>
          </div>
        </form>
      ) : (
        <div className={styles.form}>
          <StatusMessage
            kind="empty"
            message="로그인하면 댓글을 쓸 수 있어요."
            action={<Button to={loginUrl(location.pathname + location.search)}>로그인</Button>}
          />
        </div>
      )}

      <ConfirmDialog
        open={deletingId !== null}
        busy={deleteBusy}
        error={
          deleteError && (
            <AuthErrorText
              error={deleteError}
              fallback="지우지 못했어요. 다시 시도해 주세요."
              notOwnerText="내 댓글만 지울 수 있어요."
            />
          )
        }
        onCancel={() => setDeletingId(null)}
        onConfirm={handleDelete}
      />
    </section>
  )
}
