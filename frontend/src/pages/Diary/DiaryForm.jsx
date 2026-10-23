import { useState } from 'react'
import { photoUrl, uploadDiaryPhoto } from '../../api/diaries.js'
import Button from '../../components/Button/Button.jsx'
import PhotoInput from '../../components/PhotoInput/PhotoInput.jsx'
import { MOOD_EMOJI, joinTime, splitTime } from './diaryFormat.js'
import MoodMask from './MoodMask.jsx'
import styles from './DiaryForm.module.css'

// 일기 쓰기·고치기 폼 (담당: 건용). SCREEN-SPEC 5절 2·4·5번.
// trip: 고른 여행 (이름·기간을 보이고 날짜를 검사한다).
// initialValues: 고칠 때 지금 값. 없으면 날짜는 여행 시작일, 시각은 비운다.
// onSubmit(values): 저장 요청 (실패하면 던진다).
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const MOODS = Object.keys(MOOD_EMOJI)

function validate(values, trip) {
  const errors = {}
  if (values.date === '') {
    errors.date = '날짜를 적어 주세요'
  } else if (values.date < trip.start_date || values.date > trip.end_date) {
    errors.date = '여행 기간 안의 날짜를 골라 주세요'
  }
  if (joinTime(values) === null) errors.time = '시각을 적어 주세요'
  // 다이어리 제목은 공백만 적어도 화면이 막는다 (D-021). 글자 수는 앞뒤 공백을 뺀 길이 (D-029).
  const title = values.title.trim()
  if (title === '') errors.title = '제목을 적어 주세요'
  else if (title.length > 50) errors.title = '50자까지 쓸 수 있어요'
  if (values.mood === '') errors.mood = '기분을 골라 주세요'
  return errors
}

function toFormValues(trip, diary) {
  if (!diary) {
    return {
      date: trip.start_date, period: '', hour: '', minute: '', title: '', body: '', mood: '', photo: null,
    }
  }
  return {
    date: diary.date,
    ...splitTime(diary.time),
    title: diary.title,
    body: diary.body ?? '',
    mood: diary.mood,
    photo: diary.photo ?? null,
  }
}

export default function DiaryForm({ title, trip, initialValues, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => toFormValues(trip, initialValues))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  // 사진을 올리는 동안은 저장할 수 없다 (SCREEN-SPEC 1절 "사진 칸 (폼)").
  const [photoBusy, setPhotoBusy] = useState(false)

  function setField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  function handleChange(event) {
    setField(event.target.name, event.target.value)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(values, trip)
    setErrors(nextErrors)
    setSaveFailed(false)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      await onSubmit({
        date: values.date,
        time: joinTime(values),
        title: values.title,
        body: values.body === '' ? null : values.body,
        mood: values.mood,
        photo: values.photo,
      })
    } catch {
      // 422를 받아도 공통 저장 실패 문구를 보인다 (D-021). 입력한 값은 그대로 둔다.
      setSaveFailed(true)
      setSaving(false)
    }
  }

  function errorLine(name) {
    return errors[name] ? (
      <span id={`${name}-error`} className={styles.error}>
        {errors[name]}
      </span>
    ) : null
  }

  function fieldClass(name) {
    return errors[name] ? `${styles.input} ${styles.invalid}` : styles.input
  }

  function describedBy(name) {
    return errors[name] ? `${name}-error` : undefined
  }

  return (
    <>
      <div className={styles.head}>
        <h1>{title}</h1>
        <p className={styles.trip}>
          {trip.name} · {trip.start_date} ~ {trip.end_date}
        </p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.field}>
          <span className={styles.label}>날짜</span>
          <input
            type="date"
            name="date"
            min={trip.start_date}
            max={trip.end_date}
            value={values.date}
            onChange={handleChange}
            className={fieldClass('date')}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={describedBy('date')}
          />
          {errorLine('date')}
        </label>

        <fieldset className={styles.fieldset}>
          <legend className={styles.label}>시각</legend>
          <div className={styles.timeRow}>
            <select
              name="period"
              aria-label="오전/오후"
              value={values.period}
              onChange={handleChange}
              className={fieldClass('time')}
              aria-describedby={describedBy('time')}
            >
              <option value="">오전/오후</option>
              <option value="오전">오전</option>
              <option value="오후">오후</option>
            </select>
            <select
              name="hour"
              aria-label="시"
              value={values.hour}
              onChange={handleChange}
              className={fieldClass('time')}
              aria-describedby={describedBy('time')}
            >
              <option value="">시</option>
              {HOURS.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
            <select
              name="minute"
              aria-label="분"
              value={values.minute}
              onChange={handleChange}
              className={fieldClass('time')}
              aria-describedby={describedBy('time')}
            >
              <option value="">분</option>
              {MINUTES.map((minute) => (
                <option key={minute} value={minute}>
                  {minute}
                </option>
              ))}
            </select>
          </div>
          {errorLine('time')}
        </fieldset>

        <label className={styles.field}>
          <span className={styles.label}>제목</span>
          <input
            type="text"
            name="title"
            value={values.title}
            onChange={handleChange}
            className={fieldClass('title')}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describedBy('title')}
          />
          {errorLine('title')}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>본문</span>
          <textarea
            name="body"
            value={values.body}
            onChange={handleChange}
            className={`${styles.input} ${styles.textarea}`}
          />
        </label>

        <fieldset className={styles.fieldset}>
          <legend className={styles.label}>기분</legend>
          <div className={styles.moods} role="group" aria-describedby={describedBy('mood')}>
            {MOODS.map((mood) => (
              <button
                key={mood}
                type="button"
                className={values.mood === mood ? `${styles.mood} ${styles.moodSelected}` : styles.mood}
                aria-label={mood}
                aria-pressed={values.mood === mood}
                onClick={() => setField('mood', mood)}
              >
                <MoodMask mood={mood} />
                {/* 하회탈만으로는 기분을 알기 어려워 이름을 함께 보인다 (2026-10-23 사람이 정함) */}
                <span className={styles.moodName} aria-hidden="true">
                  {mood}
                </span>
              </button>
            ))}
          </div>
          {errorLine('mood')}
        </fieldset>

        <PhotoInput
          label="사진"
          alt="일기 사진"
          photos={values.photo ? [values.photo] : []}
          max={1}
          upload={uploadDiaryPhoto}
          photoUrl={photoUrl}
          onChange={(photos) => setField('photo', photos[0] ?? null)}
          onBusyChange={setPhotoBusy}
        />

        {saveFailed && <p className={styles.saveError}>저장하지 못했어요. 다시 시도해 주세요.</p>}
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel}>
            취소
          </Button>
          <Button type="submit" disabled={saving || photoBusy}>
            저장
          </Button>
        </div>
      </form>
    </>
  )
}
