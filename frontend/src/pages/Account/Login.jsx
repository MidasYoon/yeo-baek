import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { login } from '../../api/users.js'
import { useAuth } from '../../components/Auth/AuthContext.jsx'
import { loginUrl, safeNext } from '../../components/Auth/loginPaths.js'
import Button from '../../components/Button/Button.jsx'
import StatusMessage from '../../components/StatusMessage/StatusMessage.jsx'
import TextField from './TextField.jsx'
import { compactErrors } from './accountRules.js'
import styles from './Account.module.css'

// 로그인 (팀 공동, D-042). SCREEN-SPEC 8절. 주소: /login?next=돌아갈 주소
export default function Login() {
  const { user, loading, setUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = safeNext(searchParams.get('next'))
  const [values, setValues] = useState({ login_id: '', password: '' })
  const [errors, setErrors] = useState({})
  const [failMessage, setFailMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <StatusMessage kind="loading" />
  // 이미 로그인했으면 폼을 보이지 않고 돌아갈 주소로 간다.
  if (user && !busy) return <Navigate to={next} replace />

  function handleChange(event) {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = compactErrors({
      login_id: values.login_id === '' ? '아이디를 적어 주세요' : null,
      password: values.password === '' ? '비밀번호를 적어 주세요' : null,
    })
    setErrors(nextErrors)
    setFailMessage(null)
    if (Object.keys(nextErrors).length > 0) return

    setBusy(true)
    try {
      const me = await login(values)
      setUser(me)
      navigate(next, { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // 어느 쪽이 틀렸는지 가르지 않는다. 비밀번호 칸은 비운다 (SCREEN-SPEC 8절 4번).
        setFailMessage('아이디 또는 비밀번호가 맞지 않아요.')
        setValues((prev) => ({ ...prev, password: '' }))
      } else {
        setFailMessage('로그인하지 못했어요. 다시 시도해 주세요.')
      }
      setBusy(false)
    }
  }

  return (
    <section className={styles.formPage}>
      <h1>로그인</h1>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          name="login_id"
          label="아이디"
          value={values.login_id}
          onChange={handleChange}
          error={errors.login_id}
          autoComplete="username"
        />
        <TextField
          name="password"
          label="비밀번호"
          type="password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          autoComplete="current-password"
        />
        {failMessage && (
          <p className={styles.saveError} role="alert">
            {failMessage}
          </p>
        )}
        <div className={styles.actions}>
          <Button type="submit" disabled={busy}>
            로그인
          </Button>
        </div>
      </form>
      <p className={styles.switch}>
        아직 회원이 아니신가요?
        <Link to={loginUrl(next, '/signup')}>회원가입</Link>
      </p>
    </section>
  )
}
