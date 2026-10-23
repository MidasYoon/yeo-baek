import { useEffect, useRef, useState } from 'react'
import { photoUrl } from '../../api/diaries.js'
import { formatTime, formatWeekday } from './diaryFormat.js'
import MoodMask from './MoodMask.jsx'
import styles from './DiaryList.module.css'

// 일기 목록 (담당: 건용). SCREEN-SPEC 5절 2·3번, DESIGN 6절 "일기 목록".
// diaries: API 순서(날짜 → 시각 → id) 그대로 받은 일기들.
// renderActions(diary): (선택) 펼친 줄 아래에 둘 버튼. 여행 상세 안 목록(P-34)에서는 넘기지 않는다.
// initialOpenId: (선택) 처음부터 펼쳐 둘 일기 번호. 그 줄이 화면에 보이도록 목록을 움직인다 (Home C 카드, 2026-10-23 팀 합의).
// 전체 보기에서는 diary.trip_name이 있어 접힌 줄의 제목 아래에 여행명을 보인다 (D-034).
// writerOf(diary): (선택) 작성자(그 여행 주인의 닉네임)를 돌려준다. 다이어리 전체 보기만 넘기고, 여행명 뒤에 붙인다 (D-046).
// 사진이 있으면 펼친 줄의 본문 위에 보인다. 접힌 줄에는 보이지 않는다 (D-033).

// 일기 사진. 불러오지 못하면 숨긴다 (SCREEN-SPEC 1절 "사진 표시").
function DiaryPhoto({ filename }) {
  const [broken, setBroken] = useState(false)
  if (broken) return null
  // 마스킹테이프로 붙인 폴라로이드처럼 보인다 (일기장 모양, 2026-10-23 팀 합의). 테이프는 장식이다.
  return (
    <figure className={styles.polaroid}>
      <span className={styles.tape} aria-hidden="true" />
      <img
        className={styles.photo}
        src={photoUrl(filename)}
        alt="일기 사진"
        onError={() => setBroken(true)}
      />
    </figure>
  )
}

export default function DiaryList({ diaries, renderActions, initialOpenId = null, writerOf }) {
  // 줄마다 따로 펼치고 접는다. 여러 줄을 함께 펼칠 수 있다.
  const [openIds, setOpenIds] = useState(() => new Set(initialOpenId === null ? [] : [initialOpenId]))
  const initialRowRef = useRef(null)

  // 처음 펼친 줄이 화면에 보이도록 한 번만 움직인다 (AI 제안).
  useEffect(() => {
    initialRowRef.current?.scrollIntoView({ block: 'nearest' })
  }, [])

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
    <div className={styles.groups} data-stagger>
      {groups.map((group) => (
        <section key={group.date} className={styles.group}>
          <h2 className={styles.date}>
            <span className={styles.diamond} aria-hidden="true" />
            {group.date}
            <span className={styles.weekday}>{formatWeekday(group.date)}</span>
          </h2>
          <ul className={styles.rows}>
            {group.items.map((diary) => {
              const open = openIds.has(diary.id)
              const panelId = `diary-${diary.id}-body`
              // 수정·삭제 버튼. 남의 여행의 일기면 null이라 자리를 두지 않는다 (D-042).
              const actions = renderActions?.(diary)
              return (
                <li
                  key={diary.id}
                  ref={diary.id === initialOpenId ? initialRowRef : undefined}
                  className={open ? `${styles.row} ${styles.open}` : styles.row}
                >
                  <button
                    type="button"
                    className={styles.summary}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => toggle(diary.id)}
                  >
                    <span className={styles.time}>{formatTime(diary.time)}</span>
                    {/* 접힌 줄은 마우스를 올리면 기분 이름이 말풍선으로 뜨고, 펼친 줄은 하회탈 아래에 이름이 보인다 (2026-10-23 사람이 정함) */}
                    <span className={styles.moodBox}>
                      <span className={styles.mood} role="img" aria-label={diary.mood} data-mood={diary.mood}>
                        <MoodMask mood={diary.mood} />
                      </span>
                      {open && (
                        <span className={styles.moodName} aria-hidden="true">
                          {diary.mood}
                        </span>
                      )}
                    </span>
                    <span className={styles.title}>
                      {diary.title}
                      {diary.trip_name && (
                        <span className={styles.tripName}>
                          {diary.trip_name}
                          {writerOf?.(diary) && ` · ${writerOf(diary)}`}
                        </span>
                      )}
                    </span>
                    <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </button>
                  {open && (
                    <div id={panelId} className={styles.detail}>
                      {diary.photo && <DiaryPhoto key={diary.photo} filename={diary.photo} />}
                      {/* 본문이 없으면 본문 자리를 비워 둔다 (TEST-PLAN T-D-05) */}
                      <p className={styles.body}>{diary.body ?? ''}</p>
                      {actions && <div className={styles.actions}>{actions}</div>}
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
