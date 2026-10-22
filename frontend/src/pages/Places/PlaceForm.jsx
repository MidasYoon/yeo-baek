import { useState } from 'react'
import { photoUrl, uploadPlacePhoto } from '../../api/places.js'
import Button from '../../components/Button/Button.jsx'
import PhotoInput from '../../components/PhotoInput/PhotoInput.jsx'
import { REGIONS } from './regions.js'
import styles from './PlaceForm.module.css'

// 장소 추가·수정 폼 (담당: 은희). SCREEN-SPEC 4절 2·4·5번.
// trip: 고른 여행 (이름·기간을 보이고 방문 날짜를 검사한다).
// initialValues: 수정할 때 지금 값. onSubmit(values): 저장 요청 (실패하면 던진다).
const EMPTY = { region: '', name: '', visit_date: '', memo: '', photos: [] }

function validate(values, trip) {
  const errors = {}
  if (values.region === '') errors.region = '지역을 골라 주세요'
  // 공백만 적은 이름은 화면에서 막지 않는다. 서버가 422로 막는다 (D-021).
  if (values.name === '') errors.name = '장소 이름을 적어 주세요'
  else if (values.name.trim().length > 20) errors.name = '20자까지 쓸 수 있어요'
  if (values.visit_date === '') {
    errors.visit_date = '방문 날짜를 골라 주세요'
  } else if (values.visit_date < trip.start_date || values.visit_date > trip.end_date) {
    errors.visit_date = `방문 날짜는 여행 기간(${trip.start_date} ~ ${trip.end_date}) 안이어야 해요`
  }
  // 글자 수는 앞뒤 공백을 뺀 길이로 센다 (D-029).
  if (values.memo.trim().length > 20) errors.memo = '20자까지 쓸 수 있어요'
  return errors
}

export default function PlaceForm({ title, trip, initialValues = EMPTY, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues, memo: initialValues.memo ?? '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  // 사진을 올리는 동안은 저장할 수 없다 (SCREEN-SPEC 1절 "사진 칸 (폼)").
  const [photoBusy, setPhotoBusy] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(values, trip)
    setErrors(nextErrors)
    setSaveFailed(false)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      await onSubmit({ ...values, memo: values.memo === '' ? null : values.memo })
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

  function inputProps(name) {
    return {
      name,
      value: values[name],
      onChange: handleChange,
      className: errors[name] ? `${styles.input} ${styles.invalid}` : styles.input,
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? `${name}-error` : undefined,
    }
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
          <span className={styles.label}>지역</span>
          <select {...inputProps('region')}>
            <option value="" disabled>
              지역을 골라 주세요
            </option>
            {REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          <span className={styles.help}>국내 시·도만 고를 수 있어요</span>
          {errorLine('region')}
        </label>
        <label className={styles.field}>
          <span className={styles.label}>장소 이름</span>
          <input type="text" {...inputProps('name')} />
          {errorLine('name')}
        </label>
        <label className={styles.field}>
          <span className={styles.label}>방문 날짜</span>
          <input type="date" min={trip.start_date} max={trip.end_date} {...inputProps('visit_date')} />
          {errorLine('visit_date')}
        </label>
        <label className={styles.field}>
          <span className={styles.label}>메모</span>
          <input type="text" {...inputProps('memo')} />
          {errorLine('memo')}
        </label>
        <PhotoInput
          label="사진"
          alt="장소 사진"
          photos={values.photos}
          max={4}
          upload={uploadPlacePhoto}
          photoUrl={photoUrl}
          onChange={(photos) => setValues((prev) => ({ ...prev, photos }))}
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
