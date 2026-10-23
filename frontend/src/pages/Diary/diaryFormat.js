// 다이어리 화면이 함께 쓰는 표와 글자 바꾸기 (담당: 건용).

// 기분 이름 → 이모지 (DATA-MODEL 4절, D-016). 서버는 이름만 저장한다.
// 화면에는 이모지 대신 하회탈(MoodMask.jsx)을 그린다 (2026-10-23). 이 표는 기분 목록과 순서로 쓴다.
export const MOOD_EMOJI = {
  설렘: '🤩',
  행복: '😊',
  평온: '😌',
  피곤: '😩',
  아쉬움: '🥲',
}

// "HH:MM"(24시간) → "오전/오후 H:MM" (SCREEN-SPEC 1절 시각 표시, 5절 2번).
// 자정·정오: "00:30"은 "오전 12:30", "12:05"는 "오후 12:05" (2026-10-21 팀 합의).
export function formatTime(time) {
  const { period, hour, minute } = splitTime(time)
  return `${period} ${hour}:${minute}`
}

// "HH:MM" → 폼의 select 3개 값 { period: '오전'|'오후', hour: '1'~'12', minute: '00'~'59' }
export function splitTime(time) {
  const [hourText, minute] = time.split(':')
  const hour24 = Number(hourText)
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return { period: hour24 < 12 ? '오전' : '오후', hour: String(hour12), minute }
}

// 폼의 select 3개 값 → "HH:MM". 하나라도 비어 있으면 null.
// 오전 12시는 00시, 오후 12시는 12시다 (자정·정오, 2026-10-21 팀 합의).
export function joinTime({ period, hour, minute }) {
  if (!period || !hour || !minute) return null
  const hour12 = Number(hour) % 12
  const hour24 = period === '오후' ? hour12 + 12 : hour12
  return `${String(hour24).padStart(2, '0')}:${minute}`
}

// "YYYY-MM-DD" → "일요일" 같은 요일 이름 (날짜 묶음 머리, 2026-10-23 팀 합의).
// 연·월·일로 나눠 현지 날짜로 만든다. new Date('YYYY-MM-DD')는 UTC로 읽혀 시간대에 따라 하루가 밀릴 수 있다.
const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

export function formatWeekday(date) {
  const [year, month, day] = date.split('-').map(Number)
  return WEEKDAYS[new Date(year, month - 1, day).getDay()]
}
