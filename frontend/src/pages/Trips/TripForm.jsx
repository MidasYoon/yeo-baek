import { useState } from 'react'
import Button from '../../components/Button/Button.jsx'
import { countText } from './countMessage.js'
import styles from './TripForm.module.css'

// 여행 추가·수정 폼 (담당: 서준). SCREEN-SPEC 3절 2·4·5번.
// initialValues: 수정할 때 지금 값. onSubmit(values): 저장 요청 (실패하면 던진다).
const EMPTY = { name: '', destination: '', start_date: '', end_date: '', info: '' }

// 비운 칸의 안내 문구 (SCREEN-SPEC 3절 4번, "여행명을 적어 주세요"와 같은 꼴)
const REQUIRED_MESSAGES = {
  name: '여행명을 적어 주세요',
  destination: '여행지를 적어 주세요',
  start_date: '시작일을 적어 주세요',
  end_date: '종료일을 적어 주세요',
}

function validate(values) {
  const errors = {}
  for (const field of Object.keys(REQUIRED_MESSAGES)) {
    // 공백만 적은 값은 화면에서 막지 않는다. 서버가 422로 막는다 (D-021).
    if (values[field] === '') {
      errors[field] = REQUIRED_MESSAGES[field]
    }
  }
  for (const field of ['name', 'destination']) {
    // 글자 수는 앞뒤 공백을 뺀 길이로 센다 (D-029).
    if (!errors[field] && values[field].trim().length > 20) {
      errors[field] = '20자까지 쓸 수 있어요'
    }
  }
  if (!errors.start_date && !errors.end_date && values.end_date < values.start_date) {
    errors.end_date = '종료일은 시작일과 같거나 뒤여야 해요'
  }
  return errors
}

export default function TripForm({ initialValues = EMPTY, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues, info: initialValues.info ?? '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    setSaveFailed(false)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      await onSubmit({ ...values, info: values.info === '' ? null : values.info })
    } catch (error) {
      if (error.status === 409 && error.detail) {
        // 새 기간 밖에 장소·일기가 있어 고칠 수 없음 (R-T-017, R-T-019).
        setErrors({
          end_date: `새 기간 밖에 ${countText(error.detail)}이 있어요. 먼저 날짜를 고치거나 지워 주세요.`,
        })
      } else {
        // 422를 받아도 공통 저장 실패 문구를 보인다 (D-021). 입력한 값은 그대로 둔다.
        setSaveFailed(true)
      }
      setSaving(false)
    }
  }

  function field(name, label, type = 'text') {
    const errorId = `${name}-error`
    return (
      <label className={styles.field}>
        <span className={styles.label}>{label}</span>
        <input
          className={errors[name] ? `${styles.input} ${styles.invalid}` : styles.input}
          type={type}
          name={name}
          value={values[name]}
          onChange={handleChange}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? errorId : undefined}
        />
        {errors[name] && (
          <span id={errorId} className={styles.error}>
            {errors[name]}
          </span>
        )}
      </label>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {field('name', '여행명')}
      {field('destination', '여행지')}
      <div className={styles.dates}>
        {field('start_date', '시작일', 'date')}
        {field('end_date', '종료일', 'date')}
      </div>
      <label className={styles.field}>
        <span className={styles.label}>여행 정보</span>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          name="info"
          value={values.info}
          onChange={handleChange}
        />
      </label>
      {saveFailed && <p className={styles.saveError}>저장하지 못했어요. 다시 시도해 주세요.</p>}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={saving}>
          저장
        </Button>
      </div>
    </form>
  )
}
