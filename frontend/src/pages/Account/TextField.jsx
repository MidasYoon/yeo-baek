import styles from './Account.module.css'

// 회원 폼의 한 줄 입력 칸 (팀 공동, D-042). 오류는 칸 바로 아래 한 줄 (SCREEN-SPEC 1절 "입력 오류").
// help: 칸 아래 흐린 도움말 (오류가 있으면 오류만 보인다).
export default function TextField({
  name,
  label,
  type = 'text',
  value,
  onChange,
  error,
  help,
  autoComplete,
  maxLength,
}) {
  const errorId = `${name}-error`
  const helpId = `${name}-help`
  let describedBy
  if (error) describedBy = errorId
  else if (help) describedBy = helpId

  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        className={error ? `${styles.input} ${styles.invalid}` : styles.input}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {error ? (
        <span id={errorId} className={styles.error}>
          {error}
        </span>
      ) : (
        help && (
          <span id={helpId} className={styles.help}>
            {help}
          </span>
        )
      )}
    </label>
  )
}
