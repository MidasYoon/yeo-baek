import { useState } from 'react'
import { MOOD_EMOJI, formatTime } from './diaryFormat.js'
import styles from './DiaryList.module.css'

// 일기 목록 (담당: 건용). SCREEN-SPEC 5절 2·3번, DESIGN 6절 "일기 목록".
// diaries: API 순서(날짜 → 시각 → id) 그대로 받은 일기들.
// renderActions(diary): (선택) 펼친 줄 아래에 둘 버튼. 여행 상세 안 목록(P-34)에서는 넘기지 않는다.
export default function DiaryList({ diaries, renderActions }) {
  // 줄마다 따로 펼치고 접는다. 여러 줄을 함께 펼칠 수 있다.
  const [openIds, setOpenIds] = useState(() => new Set())

  function toggle(id) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // 같은 날짜의 일기를 한 묶음으로 모은다 (R-D-018). 받은 순서를 그대로 지킨다.
  const groups = []
  for (const diary of diaries) {
    const last = groups[groups.length - 1]
    if (last && last.date === diary.date) last.items.push(diary)
    else groups.push({ date: diary.date, items: [diary] })
  }

  return (
    <div className={styles.groups}>
      {groups.map((group) => (
        <section key={group.date} className={styles.group}>
          <h2 className={styles.date}>
            <span className={styles.diamond} aria-hidden="true" />
            {group.date}
          </h2>
          <ul className={styles.rows}>
            {group.items.map((diary) => {
              const open = openIds.has(diary.id)
              const panelId = `diary-${diary.id}-body`
              return (
                <li key={diary.id} className={open ? `${styles.row} ${styles.open}` : styles.row}>
                  <button
                    type="button"
                    className={styles.summary}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => toggle(diary.id)}
                  >
                    <span className={styles.time}>{formatTime(diary.time)}</span>
                    <span className={styles.mood} role="img" aria-label={diary.mood}>
                      {MOOD_EMOJI[diary.mood]}
                    </span>
                    <span className={styles.title}>{diary.title}</span>
                    <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </button>
                  {open && (
                    <div id={panelId} className={styles.detail}>
                      {/* 본문이 없으면 본문 자리를 비워 둔다 (TEST-PLAN T-D-05) */}
                      <p className={styles.body}>{diary.body ?? ''}</p>
                      {renderActions && <div className={styles.actions}>{renderActions(diary)}</div>}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
